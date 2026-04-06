import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/metrics/MetricCard';
import { AreaChart } from '../components/charts/AreaChart';
import { BarChart } from '../components/charts/BarChart';
import { PagesTable } from '../components/tables/PagesTable';
import { SourcesTable } from '../components/tables/SourcesTable';
import { useFilters } from '../hooks/useFilters';
import { getStats, getTimeseries, getPages, getSources } from '../api/client';

export function OverviewPage() {
  const { id } = useParams();
  const { filters } = useFilters();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const siteId = id!;

  const { data: stats } = useQuery({
    queryKey: ['stats', siteId, filters.from, filters.to],
    queryFn: () => getStats(siteId, filters.from, filters.to),
  });

  const { data: timeseries } = useQuery({
    queryKey: ['timeseries', siteId, filters.from, filters.to],
    queryFn: () => getTimeseries(siteId, filters.from, filters.to),
  });

  const { data: timeseriesHourly } = useQuery({
    queryKey: ['timeseries-hourly', siteId, filters.from, filters.to],
    queryFn: () => getTimeseries(siteId, filters.from, filters.to, 'hour'),
  });

  const { data: pagesData } = useQuery({
    queryKey: ['pages', siteId, filters.from, filters.to],
    queryFn: () => getPages(siteId, filters.from, filters.to, 5),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ['sources', siteId, filters.from, filters.to],
    queryFn: () => getSources(siteId, filters.from, filters.to),
  });

  const sparklineVisitors = timeseries?.data?.map((d) => d.visitors) || [];
  const sparklinePageviews = timeseries?.data?.map((d) => d.pageviews) || [];

  return (
    <div>
      <Header title="Overview" />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Unique Visitors"
          value={stats?.visitors || 0}
          change={stats?.visitors_change}
          sparklineData={sparklineVisitors}
        />
        <MetricCard
          label="Pageviews"
          value={stats?.pageviews || 0}
          change={stats?.pageviews_change}
          sparklineData={sparklinePageviews}
        />
        <MetricCard label="Bounce Rate" value={stats?.bounce_rate || 0} format="percent" />
        <MetricCard
          label="Avg. Session"
          value={stats?.avg_session_duration || 0}
          format="duration"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <AreaChart data={timeseries?.data || []} dataKey="visitors" />
        <BarChart data={timeseriesHourly?.data || []} dataKey="pageviews" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider mb-3">
            Top Pages
          </h3>
          <PagesTable pages={pagesData?.pages || []} />
        </div>
        <div>
          <h3 className="text-sm font-mono text-edge-600 uppercase tracking-wider mb-3">
            Traffic Sources
          </h3>
          <SourcesTable referrers={sourcesData?.referrers || []} utm={sourcesData?.utm || []} />
        </div>
      </div>
    </div>
  );
}
