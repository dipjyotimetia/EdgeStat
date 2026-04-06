import { useSSE } from '../../hooks/useSSE';
import { useAuth } from '../../hooks/useAuth';

interface LiveVisitorsProps {
  siteId: string | undefined;
}

export function LiveVisitors({ siteId }: LiveVisitorsProps) {
  const { masterKey } = useAuth();
  const { count, connected } = useSSE(siteId, masterKey);

  return (
    <div
      className="flex items-center gap-2 bg-edge-900/50 border border-edge-800 rounded-full px-3 py-1.5"
      aria-live="polite"
      aria-label={`${count} active visitors`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          connected ? 'bg-edge-600 animate-pulse-dot' : 'bg-edge-800'
        }`}
        aria-hidden="true"
      />
      <span className="text-sm font-mono text-edge-muted">
        <span className="text-edge-600 font-semibold">{count}</span> online
      </span>
    </div>
  );
}
