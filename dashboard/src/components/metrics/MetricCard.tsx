import { Sparkline } from '../charts/Sparkline';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  sparklineData?: number[];
  format?: 'number' | 'percent' | 'duration';
}

function formatValue(value: string | number, format: string): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'duration': {
      const mins = Math.floor(value / 60);
      const secs = Math.floor(value % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    default:
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  }
}

export function MetricCard({ label, value, change, sparklineData, format = 'number' }: MetricCardProps) {
  const changeColor = change === undefined
    ? ''
    : change > 0
      ? 'text-edge-700'
      : change < 0
        ? 'text-red-400'
        : 'text-edge-muted';
  const changePrefix = change !== undefined && change > 0 ? '+' : '';

  return (
    <div className="bg-edge-900 border border-edge-800 rounded-lg p-4 flex flex-col gap-3">
      <span className="text-xs font-mono text-edge-muted uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="text-2xl font-bold text-edge-600 font-mono tabular-nums">
            {formatValue(value, format)}
          </span>
          {change !== undefined && (
            <span className={`ml-2 text-xs font-mono ${changeColor}`}>
              {changePrefix}{change.toFixed(1)}%
            </span>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} width={80} height={32} />
        )}
      </div>
    </div>
  );
}
