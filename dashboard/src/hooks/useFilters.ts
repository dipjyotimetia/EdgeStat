import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

export interface Filters {
  from: string;
  to: string;
  device?: string;
  country?: string;
  source?: string;
}

function defaultDateRange(): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: Filters = useMemo(() => {
    const defaults = defaultDateRange();
    return {
      from: searchParams.get('from') || defaults.from,
      to: searchParams.get('to') || defaults.to,
      device: searchParams.get('device') || undefined,
      country: searchParams.get('country') || undefined,
      source: searchParams.get('source') || undefined,
    };
  }, [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setDateRange = useCallback(
    (from: string, to: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('from', from);
        next.set('to', to);
        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const defaults = defaultDateRange();
    setSearchParams({ from: defaults.from, to: defaults.to });
  }, [setSearchParams]);

  return { filters, setFilter, setDateRange, clearFilters };
}
