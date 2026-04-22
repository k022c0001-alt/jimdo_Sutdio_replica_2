import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/builder', label: 'Page Builder', icon: '🏗' },
  { path: '/backoffice', label: 'Back Office', icon: '🏢', sub: 'HR & Finance' },
  { path: '/frontoffice', label: 'Front Office', icon: '🤝', sub: 'CRM & Sales' },
  { path: '/supplychain', label: 'Supply Chain', icon: '📦', sub: 'Inventory' },
  { path: '/operations', label: 'Operations', icon: '⚙️', sub: 'Tasks' },
  { path: '/governance', label: 'Governance', icon: '🛡', sub: 'Security & Analytics' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col flex-shrink-0">
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            <div>
              <div className="font-medium">{item.label}</div>
              {item.sub && <div className="text-xs opacity-70">{item.sub}</div>}
            </div>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        SIER Platform v1.0
      </div>
    </aside>
  );
}
