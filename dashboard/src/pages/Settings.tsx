import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { listSites } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { id } = useParams();
  const { logout } = useAuth();
  const { data } = useQuery({ queryKey: ['sites'], queryFn: listSites });
  const site = data?.sites?.find((s) => s.id === id);

  const snippet = site
    ? `<script defer data-site="${site.id}" src="https://${site.domain}/s.js"></script>`
    : '';

  return (
    <div>
      <Header title="Settings" />

      <div className="max-w-2xl space-y-6">
        {/* Site info */}
        <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider">Site Details</h3>
          {site && (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-mono text-edge-700">Site ID</dt>
                <dd className="text-sm font-mono text-edge-400 mt-0.5">{site.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-edge-700">Name</dt>
                <dd className="text-sm font-mono text-edge-400 mt-0.5">{site.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-edge-700">Domain</dt>
                <dd className="text-sm font-mono text-edge-400 mt-0.5">{site.domain}</dd>
              </div>
              <div>
                <dt className="text-xs font-mono text-edge-700">API Key</dt>
                <dd className="text-sm font-mono text-edge-500 mt-0.5 bg-edge-950 border border-edge-800 rounded px-3 py-1.5 inline-block">
                  {site.api_key}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* Snippet */}
        <div className="bg-edge-900/50 border border-edge-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider">Tracking Snippet</h3>
          <div className="relative">
            <pre className="bg-edge-950 border border-edge-800 rounded-lg p-4 text-sm text-edge-500 font-mono overflow-x-auto">
              <code>{snippet}</code>
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(snippet)}
              className="absolute top-2 right-2 text-xs bg-edge-700 hover:bg-edge-600 text-edge-950 px-2 py-1 rounded font-mono transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-edge-900/50 border border-red-900/30 rounded-xl p-5">
          <h3 className="text-sm font-mono text-red-400 uppercase tracking-wider mb-3">Danger Zone</h3>
          <button
            onClick={logout}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-mono text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Disconnect Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
