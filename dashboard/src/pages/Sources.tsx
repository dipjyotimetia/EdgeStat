import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { SourcesTable } from '../components/tables/SourcesTable';
import { useFilters } from '../hooks/useFilters';
import { getSources } from '../api/client';

export function SourcesPage() {
  const { id } = useParams();
  const { filters } = useFilters();

  const { data } = useQuery({
    queryKey: ['sources', id, filters.from, filters.to],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    queryFn: () => getSources(id!, filters.from, filters.to),
  });

  return (
    <div>
      <Header title="Traffic Sources" />
      <SourcesTable referrers={data?.referrers || []} utm={data?.utm || []} />
    </div>
  );
}
