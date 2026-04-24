/**
 * sql-query-widget.js
 *
 * 対話型 SQL クエリ ウィジェット
 *
 * 機能:
 *   1. シナリオ選択ウィザード（プリセット9種 + フリーテキスト入力）
 *   2. インライン SQL エディタ（提案SQLをそのまま編集可能）
 *   3. バックエンドへの SELECT 実行とテーブル形式での結果表示
 *
 * バックエンド連携:
 *   POST /api/sql-connector/query  (JWT認証必須)
 *   認証トークン取得順: window.SQL_CONNECTOR_TOKEN → localStorage['token']
 *
 * 設定（任意）:
 *   window.SQL_CONNECTOR_API_BASE  – APIベースURL（デフォルト: http://localhost:3001/api/sql-connector）
 *   window.SQL_CONNECTOR_TOKEN     – 直接トークンを指定する場合
 *
 * 新しいシナリオの追加方法:
 *   SCENARIO_PRESETS 配列に { label, keywords, sql, hint } を追加するだけです。
 *
 * Plugin-First 原則:
 *   このファイルは完全に独立しており、widget-system.js / page-manager.js を変更しません。
 *   index.html への <script> タグ追加のみで有効になります。
 */

'use strict';

// ---------------------------------------------------------------------------
// シナリオプリセット – クライアントサイドのみで動作（バックエンド不要）
// ---------------------------------------------------------------------------

const SCENARIO_PRESETS = [
  {
    label: '🏀 部活・チーム名簿',
    keywords: ['名簿', '部員', 'メンバー', '部活', 'チーム', '選手', 'バスケ', 'サッカー', '野球', 'クラブ'],
    sql: `SELECT name, email, department, position, hire_date, status
FROM hr_employees
WHERE status = 'active'
ORDER BY name
LIMIT 50;`,
    hint: '例: バスケ部・サッカー部・プロジェクトチームの名簿',
  },
  {
    label: '👥 顧客リスト (CRM)',
    keywords: ['顧客', 'クライアント', 'CRM', '取引先', '得意先'],
    sql: `SELECT name, email, phone, company, industry, status
FROM crm_customers
ORDER BY name
LIMIT 50;`,
    hint: '取引先・見込み客の一覧',
  },
  {
    label: '💼 商談パイプライン',
    keywords: ['案件', '商談', 'SFA', 'パイプライン', '受注'],
    sql: `SELECT d.title, d.value, d.stage, d.probability, d.close_date,
       c.name AS customer_name
FROM crm_deals d
LEFT JOIN crm_customers c ON d.customer_id = c.id
ORDER BY d.value DESC
LIMIT 50;`,
    hint: '商談進捗・受注見込み額の確認',
  },
  {
    label: '📦 在庫一覧',
    keywords: ['在庫', '商品', '棚卸', 'SKU', '物品', '備品'],
    sql: `SELECT sku, name, category, quantity, unit_cost, selling_price,
       reorder_level, location
FROM inventory_items
ORDER BY category, name
LIMIT 50;`,
    hint: '全商品の在庫数・価格の確認',
  },
  {
    label: '⚠️ 在庫不足アラート',
    keywords: ['在庫不足', '補充', '発注', '欠品'],
    sql: `SELECT sku, name, category, quantity, reorder_level, supplier
FROM inventory_items
WHERE quantity <= reorder_level
ORDER BY (quantity - reorder_level) ASC
LIMIT 50;`,
    hint: '発注点を下回った商品の抽出',
  },
  {
    label: '💰 経費・支出一覧',
    keywords: ['経費', '支出', '費用', '精算', '出張'],
    sql: `SELECT category, description, amount, date, status
FROM finance_expenses
ORDER BY date DESC
LIMIT 50;`,
    hint: '経費申請・支出記録の確認',
  },
  {
    label: '📊 予算 vs 実績',
    keywords: ['予算', 'バジェット', '予実', '部門費'],
    sql: `SELECT name, department, amount, spent,
       (amount - spent) AS remaining,
       period, fiscal_year, status
FROM finance_budgets
ORDER BY fiscal_year DESC, department
LIMIT 50;`,
    hint: '部門別の予算消化状況',
  },
  {
    label: '✅ タスク・ToDoリスト',
    keywords: ['タスク', 'todo', 'ToDo', '作業', '課題', 'Kanban'],
    sql: `SELECT title, status, priority, due_date, module, description
FROM workflow_tasks
ORDER BY priority DESC, due_date ASC
LIMIT 50;`,
    hint: 'Kanbanタスク・作業一覧',
  },
  {
    label: '🕐 勤怠・出退勤記録',
    keywords: ['勤怠', '出退勤', '出勤', '退勤', '勤務'],
    sql: `SELECT e.name, a.date, a.check_in, a.check_out, a.status, a.notes
FROM hr_attendance a
JOIN hr_employees e ON a.employee_id = e.id
ORDER BY a.date DESC, e.name
LIMIT 50;`,
    hint: '従業員の出退勤記録',
  },
  {
    label: '✏️ カスタムSQL',
    keywords: [],
    sql: '-- 自由にSELECT文を入力してください\nSELECT * FROM hr_employees LIMIT 20;',
    hint: '独自のSELECT文を直接入力',
  },
];

// ---------------------------------------------------------------------------
// SqlQueryWidget
// ---------------------------------------------------------------------------

class SqlQueryWidget extends BaseWidget {
  constructor() {
    super({
      id: 'sql-query',
      label: 'SQLクエリ',
      icon: '🗄️',
      // createBlock() をフル上書きするため endpoint は実際には使用しませんが
      // BaseWidget のバリデーションを満たすために設定します
      endpoint: '/api/sql-connector/query',
    });
    this._apiBase =
      window.SQL_CONNECTOR_API_BASE ||
      'http://localhost:3001/api/sql-connector';
  }

  // -------------------------------------------------------------------------
  // createBlock() をオーバーライドしてウィザードUIを構築します
  // -------------------------------------------------------------------------

  async createBlock() {
    const block = document.createElement('div');
    block.className = 'widget-block sql-query-block';
    block.dataset.widgetId = this.id;

    // 削除ボタン（基底クラスと同じパターン）
    const del = document.createElement('button');
    del.className = 'widget-delete';
    del.title = 'ウィジェットを削除';
    del.textContent = '✕';
    del.addEventListener('click', () => block.remove());
    block.appendChild(del);

    block.appendChild(this._buildSetupPanel(block));
    return block;
  }

  // -------------------------------------------------------------------------
  // Step 1: シナリオ選択パネル
  // -------------------------------------------------------------------------

  _buildSetupPanel(block) {
    const panel = document.createElement('div');
    panel.className = 'sql-setup-panel';

    const title = document.createElement('h3');
    title.className = 'sql-panel-title';
    title.textContent = '🗄️ SQLクエリ ウィジェット';
    panel.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'sql-panel-desc';
    desc.textContent = 'やりたいことに近いシナリオを選ぶか、自由に説明を入力してSQLを取得してください。';
    panel.appendChild(desc);

    // プリセットボタングリッド
    const grid = document.createElement('div');
    grid.className = 'sql-scenario-grid';
    for (const preset of SCENARIO_PRESETS) {
      const btn = document.createElement('button');
      btn.className = 'sql-scenario-btn';
      btn.textContent = preset.label;
      btn.title = preset.hint;
      btn.addEventListener('click', () => {
        panel.replaceWith(this._buildEditorPanel(block, preset.sql, preset.label));
      });
      grid.appendChild(btn);
    }
    panel.appendChild(grid);

    // フリーテキスト入力エリア
    const orLabel = document.createElement('p');
    orLabel.className = 'sql-or-label';
    orLabel.textContent = '── または、やりたいことを日本語で入力 ──';
    panel.appendChild(orLabel);

    const freeInput = document.createElement('input');
    freeInput.type = 'text';
    freeInput.className = 'sql-free-input';
    freeInput.placeholder = '例: バスケ部の名簿を作りたい、在庫不足を確認したい…';
    panel.appendChild(freeInput);

    const suggestBtn = document.createElement('button');
    suggestBtn.className = 'sql-suggest-btn';
    suggestBtn.textContent = '💡 SQL提案を取得';
    suggestBtn.addEventListener('click', () => {
      const text = freeInput.value.trim();
      const preset = text ? this._findPreset(text) : SCENARIO_PRESETS[SCENARIO_PRESETS.length - 1];
      panel.replaceWith(this._buildEditorPanel(block, preset.sql, preset.label));
    });
    // Enter キーでも発動
    freeInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') suggestBtn.click();
    });
    panel.appendChild(suggestBtn);

    return panel;
  }

  // -------------------------------------------------------------------------
  // Step 2: SQLエディタパネル
  // -------------------------------------------------------------------------

  _buildEditorPanel(block, initialSql, scenarioLabel) {
    const panel = document.createElement('div');
    panel.className = 'sql-editor-panel';

    // ヘッダー（シナリオ名 + 戻るボタン）
    const header = document.createElement('div');
    header.className = 'sql-editor-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'sql-back-btn';
    backBtn.textContent = '← シナリオ選択に戻る';
    backBtn.addEventListener('click', () => {
      panel.replaceWith(this._buildSetupPanel(block));
    });
    header.appendChild(backBtn);

    const labelEl = document.createElement('span');
    labelEl.className = 'sql-scenario-label';
    labelEl.textContent = scenarioLabel;
    header.appendChild(labelEl);
    panel.appendChild(header);

    // SQLエディタ（textarea）
    const textarea = document.createElement('textarea');
    textarea.className = 'sql-editor-textarea';
    textarea.value = initialSql;
    textarea.rows = 8;
    textarea.spellcheck = false;
    panel.appendChild(textarea);

    // 注意書き
    const hint = document.createElement('p');
    hint.className = 'sql-editor-hint';
    hint.innerHTML = '⚠️ <strong>SELECT文のみ</strong>実行できます。INSERT / UPDATE / DELETE 等は使用できません。';
    panel.appendChild(hint);

    // 実行ボタン
    const runBtn = document.createElement('button');
    runBtn.className = 'sql-run-btn';
    runBtn.textContent = '▶ クエリを実行';
    runBtn.addEventListener('click', async () => {
      const sql = textarea.value.trim();
      runBtn.disabled = true;
      runBtn.textContent = '実行中…';
      try {
        const resultEl = await this._executeQuery(sql);
        const existing = panel.querySelector('.sql-result-area');
        if (existing) existing.remove();
        panel.appendChild(resultEl);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = '▶ クエリを実行';
      }
    });
    panel.appendChild(runBtn);

    return panel;
  }

  // -------------------------------------------------------------------------
  // クエリ実行 → 結果テーブル構築
  // -------------------------------------------------------------------------

  async _executeQuery(sql) {
    const resultArea = document.createElement('div');
    resultArea.className = 'sql-result-area';

    const token =
      (typeof window !== 'undefined' && window.SQL_CONNECTOR_TOKEN) ||
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      null;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let data;
    try {
      const res = await fetch(`${this._apiBase}/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql }),
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    } catch (err) {
      const errEl = document.createElement('div');
      errEl.className = 'sql-result-error';
      errEl.innerHTML =
        `<strong>❌ エラー</strong><br>${this._escapeHtml(err.message)}<br>` +
        `<small>バックエンド (<code>${this._escapeHtml(this._apiBase)}</code>) が起動しているか、` +
        `ログイン済みかを確認してください。</small>`;
      resultArea.appendChild(errEl);
      return resultArea;
    }

    const { columns, rows, total, truncated } = data;

    const meta = document.createElement('p');
    meta.className = 'sql-result-meta';
    meta.textContent = truncated
      ? `✅ ${total} 件中 200 件を表示（上限に達しました）`
      : `✅ ${total} 件取得`;
    resultArea.appendChild(meta);

    if (columns.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'sql-result-empty';
      empty.textContent = '結果が 0 件でした。';
      resultArea.appendChild(empty);
      return resultArea;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'sql-table-wrapper';

    const table = document.createElement('table');
    table.className = 'sql-result-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const col of columns) {
      const th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const col of columns) {
        const td = document.createElement('td');
        const val = row[col];
        td.textContent = val == null ? '—' : String(val);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    resultArea.appendChild(wrapper);

    return resultArea;
  }

  // -------------------------------------------------------------------------
  // フリーテキストからキーワードマッチで最適なプリセットを選択
  // -------------------------------------------------------------------------

  _findPreset(text) {
    const lower = text.toLowerCase();
    let best = SCENARIO_PRESETS[SCENARIO_PRESETS.length - 1]; // カスタムSQL がフォールバック
    let bestScore = 0;

    for (const preset of SCENARIO_PRESETS.slice(0, -1)) {
      const score = preset.keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        best = preset;
      }
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // XSS対策: 文字列をHTMLエスケープ
  // -------------------------------------------------------------------------

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // render() は createBlock() が完全上書きするため使用されません
  render(_data) {
    return document.createElement('div');
  }
}

// ウィジェットを登録
WidgetRegistry.register(new SqlQueryWidget());
