import { useParams } from 'react-router';
import { Header } from '../components/layout/Header';
import { EventExplorer } from '../components/events/EventExplorer';
import { useFilters } from '../hooks/useFilters';

export function EventsPage() {
  const { id } = useParams();
  const { filters } = useFilters();

  return (
    <div>
      <Header title="Custom Events" />
      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
      <EventExplorer siteId={id!} from={filters.from} to={filters.to} />
    </div>
  );
}
