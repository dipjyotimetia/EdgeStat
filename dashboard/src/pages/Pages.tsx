import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { PagesTable } from '../components/tables/PagesTable';
import { useFilters } from '../hooks/useFilters';
import { getPages } from '../api/client';

export function PagesPage() {
  const { id } = useParams();
  const { filters } = useFilters();

  const { data } = useQuery({
    queryKey: ['pages', id, filters.from, filters.to, 50],
    queryFn: () => getPages(id!, filters.from, filters.to, 50),
  });

  return (
    <div>
      <Header title="Pages" />
      <PagesTable pages={data?.pages || []} />
    </div>
  );
}
