import type { PageData } from '../../api/client';

interface PagesTableProps {
  pages: PageData[];
}

export function PagesTable({ pages }: PagesTableProps) {
  const maxViews = Math.max(...pages.map((p) => p.views), 1);

  return (
    <div className="bg-edge-900/50 border border-edge-800 rounded-xl overflow-hidden">
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-edge-800">
            <th className="text-left text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Page</th>
            <th className="text-right text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Views</th>
            <th className="text-right text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Visitors</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((page) => (
            <tr key={page.url} className="border-b border-edge-800/30 hover:bg-edge-900/80 transition-colors">
              <td className="px-5 py-3 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-edge-800/20 rounded-r"
                  style={{ width: `${(page.views / maxViews) * 100}%` }}
                />
                <span className="relative text-sm font-mono text-edge-500 truncate block max-w-md">
                  {page.url}
                </span>
              </td>
              <td className="text-right px-5 py-3 text-sm font-mono text-edge-400 tabular-nums">
                {page.views.toLocaleString()}
              </td>
              <td className="text-right px-5 py-3 text-sm font-mono text-edge-600 tabular-nums">
                {page.visitors.toLocaleString()}
              </td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-8 text-center text-sm font-mono text-edge-muted">
                No page data for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
