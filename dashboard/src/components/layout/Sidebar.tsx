import { NavLink, useParams, useNavigate } from 'react-router';
import { Logo } from './Logo';
import { useQuery } from '@tanstack/react-query';
import { listSites } from '../../api/client';
import { clsx } from 'clsx';

const navItems = [
  { label: 'Overview', path: '', icon: '◈' },
  { label: 'Pages', path: '/pages', icon: '☰' },
  { label: 'Sources', path: '/sources', icon: '⟶' },
  { label: 'Events', path: '/events', icon: '⚡' },
  { label: 'Funnels', path: '/funnels', icon: '▽' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

export function Sidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['sites'], queryFn: listSites });
  const sites = data?.sites || [];

  return (
    <aside
      className="flex flex-col w-64 min-h-screen bg-edge-950 border-r border-edge-800 p-4"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mb-8">
        <Logo />
      </div>

      {/* Site selector */}
      {sites.length > 0 && (
        <div className="mb-6">
          <label htmlFor="site-select" className="sr-only">
            Select site
          </label>
          <select
            id="site-select"
            value={id || ''}
            onChange={(e) => {
              if (e.target.value) {
                navigate(`/sites/${e.target.value}`);
              }
            }}
            className="w-full bg-edge-900 border border-edge-800 rounded-lg px-3 py-2 text-sm text-edge-500 font-mono focus:outline-none focus:ring-2 focus:ring-edge-700"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={`/sites/${id}${item.path}`}
            end={item.path === ''}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors',
                isActive
                  ? 'bg-edge-900 text-edge-600 border border-edge-800'
                  : 'text-edge-muted hover:text-edge-700 hover:bg-edge-900/50'
              )
            }
          >
            <span className="text-base" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-edge-800">
        <p className="text-xs font-mono text-edge-muted tracking-wide uppercase">
          Analytics at the edge
        </p>
        <p className="text-xs font-mono text-edge-muted/60 mt-1">Owned by you.</p>
      </div>
    </aside>
  );
}
