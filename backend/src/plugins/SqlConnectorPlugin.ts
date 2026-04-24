/**
 * SqlConnectorPlugin.ts
 *
 * バックエンドプラグイン: 内蔵 SQLite データベースへの読み取り専用アクセスを提供します。
 *
 * 提供エンドポイント（全て /api/sql-connector/ 以下）:
 *   GET  /scenarios  – シナリオ一覧（UI ウィザード用、認証不要）
 *   GET  /tables     – テーブル一覧とカラム情報（認証必須）
 *   POST /suggest    – フリーテキストからSQL提案を返す（認証必須）
 *   POST /query      – SELECT 文のみ実行し結果を返す（認証必須）
 *
 * 安全策:
 *   - SELECT 文（または WITH ... SELECT）のみ許可
 *   - 返却行数の上限: MAX_ROWS (200)
 *   - テナント分離: クエリにはテナントIDによるフィルタを追加しません
 *     （SELECT権限はアプリ内DBのみ。外部DBへの接続は SqlConnectorPlugin v2 で対応予定）
 *
 * Plugin-First 原則:
 *   このファイル単体で完結しており、コア（app.ts）への変更は
 *   import 1行 + app.use() 1行のみです。
 */

import { Router, Response } from 'express';
import { getDb } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Plugin } from './PluginManager';

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const MAX_ROWS = 200;

// ---------------------------------------------------------------------------
// シナリオプリセット定義
// キーワードマッチングで最適なSQL提案を選択します
// ---------------------------------------------------------------------------

interface ScenarioPreset {
  scenario: string;
  description: string;
  keywords: string[];
  sql: string;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    scenario: '部活・チーム名簿',
    description: '従業員テーブルからアクティブなメンバーの名簿を取得します。部活・プロジェクトチーム・クラブ活動の名簿作成に最適です。',
    keywords: ['名簿', '部員', 'メンバー', '部活', 'チーム', '選手', 'バスケ', 'サッカー', '野球', '陸上', '水泳', 'クラブ'],
    sql: `SELECT name, email, department, position, hire_date, status
FROM hr_employees
WHERE status = 'active'
ORDER BY name
LIMIT 50;`,
  },
  {
    scenario: '顧客リスト (CRM)',
    description: 'CRM顧客テーブルから顧客一覧を取得します。',
    keywords: ['顧客', 'クライアント', 'CRM', '取引先', '得意先', 'お客様'],
    sql: `SELECT name, email, phone, company, industry, status
FROM crm_customers
ORDER BY name
LIMIT 50;`,
  },
  {
    scenario: '商談パイプライン',
    description: '商談テーブルから案件一覧を顧客名と共に取得します。',
    keywords: ['案件', '商談', 'ディール', 'SFA', 'パイプライン', '受注'],
    sql: `SELECT d.title, d.value, d.stage, d.probability, d.close_date,
       c.name AS customer_name
FROM crm_deals d
LEFT JOIN crm_customers c ON d.customer_id = c.id
ORDER BY d.value DESC
LIMIT 50;`,
  },
  {
    scenario: '在庫一覧',
    description: '在庫テーブルから全商品の在庫状況を取得します。',
    keywords: ['在庫', '商品', '棚卸', 'SKU', '物品', '備品', 'アイテム'],
    sql: `SELECT sku, name, category, quantity, unit_cost, selling_price,
       reorder_level, location
FROM inventory_items
ORDER BY category, name
LIMIT 50;`,
  },
  {
    scenario: '在庫不足アラート',
    description: '在庫数が発注点以下の商品を抽出します。補充・発注管理に活用できます。',
    keywords: ['在庫不足', '補充', '発注', 'ローストック', '欠品'],
    sql: `SELECT sku, name, category, quantity, reorder_level, supplier
FROM inventory_items
WHERE quantity <= reorder_level
ORDER BY (quantity - reorder_level) ASC
LIMIT 50;`,
  },
  {
    scenario: '経費・支出一覧',
    description: '経費テーブルから支出一覧を取得します。',
    keywords: ['経費', '支出', '費用', '出費', '精算', '出張'],
    sql: `SELECT category, description, amount, date, status
FROM finance_expenses
ORDER BY date DESC
LIMIT 50;`,
  },
  {
    scenario: '予算 vs 実績サマリー',
    description: '予算テーブルから予算消化状況のサマリーを取得します。',
    keywords: ['予算', 'バジェット', '予実', '部門費', '予算管理'],
    sql: `SELECT name, department, amount, spent,
       (amount - spent) AS remaining,
       period, fiscal_year, status
FROM finance_budgets
ORDER BY fiscal_year DESC, department
LIMIT 50;`,
  },
  {
    scenario: 'タスク・ToDoリスト',
    description: 'ワークフロータスクテーブルからタスク一覧を取得します。',
    keywords: ['タスク', 'todo', 'ToDo', '作業', '課題', 'Kanban', 'かんばん', '進捗'],
    sql: `SELECT title, status, priority, due_date, module, description
FROM workflow_tasks
ORDER BY priority DESC, due_date ASC
LIMIT 50;`,
  },
  {
    scenario: '勤怠・出退勤記録',
    description: '勤怠テーブルから出退勤記録を従業員名と共に取得します。',
    keywords: ['勤怠', '出退勤', '出勤', '退勤', '勤務', '残業'],
    sql: `SELECT e.name, a.date, a.check_in, a.check_out, a.status, a.notes
FROM hr_attendance a
JOIN hr_employees e ON a.employee_id = e.id
ORDER BY a.date DESC, e.name
LIMIT 50;`,
  },
];

// ---------------------------------------------------------------------------
// ヘルパー関数
// ---------------------------------------------------------------------------

/**
 * SELECT文（または WITH...SELECT）のみ true を返します。
 * INSERT / UPDATE / DELETE 等の破壊的操作は拒否します。
 */
function isSelectOnly(sql: string): boolean {
  // 入力長を制限して ReDoS リスクを排除
  const trimmed = sql.trim().slice(0, 8000);
  // 連続した空白を単一スペースに置換（固定長文字列に適用するため安全）
  const normalized = trimmed.replace(/[ \t\r\n]+/g, ' ').toUpperCase();
  if (!/^(WITH |SELECT )/.test(normalized)) return false;
  const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|ATTACH|DETACH|PRAGMA)\b/;
  return !forbidden.test(normalized);
}

/**
 * フリーテキストからキーワードマッチングで最適なシナリオを選びます。
 * 一致するものがなければ null を返します。
 */
function findBestPreset(text: string): ScenarioPreset | null {
  const lower = text.toLowerCase();
  let best: ScenarioPreset | null = null;
  let bestScore = 0;

  for (const preset of SCENARIO_PRESETS) {
    const score = preset.keywords.filter(k => lower.includes(k.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }
  return bestScore > 0 ? best : null;
}

// ---------------------------------------------------------------------------
// Express Router
// ---------------------------------------------------------------------------

const router = Router();

/**
 * GET /api/sql-connector/scenarios
 * シナリオ一覧を返します（認証不要 – UIウィザード初期表示に使用）。
 */
router.get('/scenarios', (_req, res: Response) => {
  res.json({
    scenarios: SCENARIO_PRESETS.map(({ scenario, description }) => ({ scenario, description })),
  });
});

/**
 * GET /api/sql-connector/tables
 * 利用可能なテーブルとカラム一覧を返します（認証必須）。
 */
router.get('/tables', authenticate, (_req: AuthRequest, res: Response) => {
  const db = getDb();
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as Array<{ name: string }>;

  const tableInfo = tables.map(({ name }) => {
    // テーブル名をアルファベット・数字・アンダースコアのみに制限して SQL インジェクションを防ぐ
    if (!/^[A-Za-z0-9_]+$/.test(name)) return null;
    const columns = db.prepare(`PRAGMA table_info(${name})`).all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;
    return {
      name,
      columns: columns.map(c => ({
        name: c.name,
        type: c.type,
        required: c.notnull === 1,
        primaryKey: c.pk === 1,
      })),
    };
  }).filter(Boolean);

  res.json({ tables: tableInfo });
});

/**
 * POST /api/sql-connector/suggest
 * Body: { scenario: string }
 * フリーテキストのシナリオからSQL提案を返します（認証必須）。
 */
router.post('/suggest', authenticate, (req: AuthRequest, res: Response) => {
  const { scenario } = req.body;
  if (!scenario || typeof scenario !== 'string') {
    return res.status(400).json({ error: 'scenario (string) は必須です。' });
  }

  const match = findBestPreset(scenario);
  if (match) {
    return res.json({
      matched: true,
      scenario: match.scenario,
      description: match.description,
      sql: match.sql,
    });
  }

  return res.json({
    matched: false,
    scenario: 'カスタムSQL',
    description: '一致するシナリオが見つかりませんでした。自由にSELECT文を入力してください。',
    sql: '-- 自由にSQLを入力してください\nSELECT * FROM hr_employees LIMIT 20;',
  });
});

/**
 * POST /api/sql-connector/query
 * Body: { sql: string }
 * SELECT文のみ実行し、結果を返します（認証必須）。
 * 最大 MAX_ROWS 件を返します。
 */
router.post('/query', authenticate, (req: AuthRequest, res: Response) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'sql (string) は必須です。' });
  }

  // 入力長の上限（isSelectOnly 内でもスライスするが、ここでも早期拒否する）
  if (sql.length > 8000) {
    return res.status(400).json({ error: 'SQLは8000文字以内で入力してください。' });
  }

  if (!isSelectOnly(sql)) {
    return res.status(403).json({
      error: 'このAPIはSELECT文のみ実行できます。INSERT / UPDATE / DELETE 等は使用できません。',
    });
  }

  try {
    const db = getDb();
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const truncated = rows.length > MAX_ROWS;

    return res.json({
      columns,
      rows: rows.slice(0, MAX_ROWS),
      total: rows.length,
      truncated,
    });
  } catch (err: any) {
    return res.status(400).json({ error: `SQLエラー: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// Plugin 定義
// ---------------------------------------------------------------------------

export const SqlConnectorPlugin: Plugin & { router: typeof router } = {
  id: 'sql-connector',
  name: 'SQL Connector',
  version: '1.0.0',
  description:
    '内蔵SQLiteデータベースへの読み取り専用SQLクエリを提供するプラグイン。' +
    'ウィジェットからシナリオベースのSQL提案とテーブル結果表示が可能です。',
  // routes: Plugin インターフェース準拠。app.ts は .routes でマウントします。
  routes: router,
  // router: app.ts が SqlConnectorPlugin.router でアクセスできる便宜的エイリアス
  get router() { return router; },
  onInstall() {
    console.log('[SqlConnectorPlugin] インストールされました。');
  },
  onUninstall() {
    console.log('[SqlConnectorPlugin] アンインストールされました。');
  },
};

export default SqlConnectorPlugin;
