import type { Filters } from '../../hooks/useFilters';

interface FilterChipsProps {
  filters: Filters;
  onRemove: (key: string, value: undefined) => void;
  onClear: () => void;
}

export function FilterChips({ filters, onRemove, onClear }: FilterChipsProps) {
  const activeFilters = Object.entries(filters)
    .filter(([key, val]) => val && key !== 'from' && key !== 'to')
    .map(([key, val]) => ({ key, value: val as string }));

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap" role="list" aria-label="Active filters">
      {activeFilters.map(({ key, value }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 bg-edge-800/30 border border-edge-800 rounded-full px-3 py-1 text-xs font-mono text-edge-500"
          role="listitem"
        >
          <span className="text-edge-700">{key}:</span>
          {value}
          <button
            onClick={() => onRemove(key, undefined)}
            className="text-edge-700 hover:text-red-400 ml-1"
            aria-label={`Remove ${key} filter`}
          >
            &#10005;
          </button>
        </span>
      ))}
      <button
        onClick={onClear}
        className="text-xs font-mono text-edge-700 hover:text-edge-600 underline"
      >
        Clear all
      </button>
    </div>
  );
}
