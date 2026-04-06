import { useParams } from 'react-router';
import { Header } from '../components/layout/Header';
import { FunnelBuilder } from '../components/funnels/FunnelBuilder';

export function FunnelsPage() {
  const { id } = useParams();

  return (
    <div>
      <Header title="Funnels" />
      <FunnelBuilder siteId={id!} />
    </div>
  );
}
