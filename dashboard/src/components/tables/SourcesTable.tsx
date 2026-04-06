import { useState } from 'react';
import type { SourceData } from '../../api/client';
import { clsx } from 'clsx';

interface SourcesTableProps {
  referrers: SourceData[];
  utm: SourceData[];
}

export function SourcesTable({ referrers, utm }: SourcesTableProps) {
  const [tab, setTab] = useState<'referrers' | 'utm'>('referrers');
  const data = tab === 'referrers' ? referrers : utm;
  const maxVisitors = Math.max(...data.map((s) => s.visitors), 1);

  return (
    <div className="bg-edge-900/50 border border-edge-800 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-edge-800" role="tablist">
        {(['referrers', 'utm'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-5 py-3 text-xs font-mono uppercase tracking-wider transition-colors',
              tab === t ? 'text-edge-600 border-b-2 border-edge-700' : 'text-edge-700 hover:text-edge-600',
            )}
          >
            {t === 'referrers' ? 'Referrers' : 'UTM Campaigns'}
          </button>
        ))}
      </div>

      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-edge-800">
            <th className="text-left text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Source</th>
            <th className="text-right text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Visitors</th>
            <th className="text-right text-xs font-mono text-edge-700 uppercase tracking-wider px-5 py-3" scope="col">Pageviews</th>
          </tr>
        </thead>
        <tbody>
          {data.map((source) => (
            <tr key={source.source} className="border-b border-edge-800/30 hover:bg-edge-900/80 transition-colors">
              <td className="px-5 py-3 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-edge-800/20 rounded-r"
                  style={{ width: `${(source.visitors / maxVisitors) * 100}%` }}
                />
                <span className="relative text-sm font-mono text-edge-500">{source.source}</span>
              </td>
              <td className="text-right px-5 py-3 text-sm font-mono text-edge-400 tabular-nums">
                {source.visitors.toLocaleString()}
              </td>
              <td className="text-right px-5 py-3 text-sm font-mono text-edge-600 tabular-nums">
                {source.pageviews.toLocaleString()}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-8 text-center text-sm font-mono text-edge-muted">
                No source data for this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
