import { LiveVisitors } from '../realtime/LiveVisitors';
import { DateRangePicker } from '../filters/DateRangePicker';
import { FilterChips } from '../filters/FilterChips';
import { useFilters } from '../../hooks/useFilters';
import { useParams } from 'react-router';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { id } = useParams();
  const { filters, setDateRange, setFilter, clearFilters } = useFilters();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-edge-400 font-mono">{title}</h1>
        <LiveVisitors siteId={id} />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <FilterChips filters={filters} onRemove={setFilter} onClear={clearFilters} />
        <DateRangePicker from={filters.from} to={filters.to} onChange={setDateRange} />
      </div>
    </header>
  );
}
