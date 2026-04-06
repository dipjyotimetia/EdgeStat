import type { StatsResponse, TimeseriesPoint, PageStats, SourceStats } from '@edgestat/schemas';

function dateToTimestamp(date: string): number {
  return new Date(date + 'T00:00:00Z').getTime();
}

function endOfDay(date: string): number {
  return new Date(date + 'T23:59:59.999Z').getTime();
}

export async function getOverviewStats(
  db: D1Database,
  siteId: string,
  from: string,
  to: string,
): Promise<StatsResponse> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);
  const periodMs = toTs - fromTs;
  const prevFromTs = fromTs - periodMs - 1;
  const prevToTs = fromTs - 1;

  // Run all 4 independent queries in parallel
  const [current, sessionStats, durationStat, previous] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?`,
    ).bind(siteId, fromTs, toTs).first<{ pageviews: number; visitors: number }>(),

    db.prepare(
      `SELECT COUNT(*) as total, SUM(CASE WHEN pv_count = 1 THEN 1 ELSE 0 END) as bounced
       FROM (SELECT session_id, COUNT(*) as pv_count FROM events
             WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
             GROUP BY session_id)`,
    ).bind(siteId, fromTs, toTs).first<{ total: number; bounced: number }>(),

    db.prepare(
      `SELECT AVG(duration) as avg_session_duration FROM (
         SELECT (MAX(timestamp) - MIN(timestamp)) / 1000.0 as duration FROM events
         WHERE site_id = ? AND timestamp >= ? AND timestamp <= ?
         GROUP BY session_id HAVING COUNT(*) > 1)`,
    ).bind(siteId, fromTs, toTs).first<{ avg_session_duration: number }>(),

    db.prepare(
      `SELECT COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?`,
    ).bind(siteId, prevFromTs, prevToTs).first<{ pageviews: number; visitors: number }>(),
  ]);

  const pv = current?.pageviews ?? 0;
  const vis = current?.visitors ?? 0;
  const prevPv = previous?.pageviews ?? 0;
  const prevVis = previous?.visitors ?? 0;
  const sessions = sessionStats?.total ?? 0;
  const bounceRate = sessions > 0 ? (sessionStats?.bounced ?? 0) / sessions : 0;

  return {
    visitors: vis,
    pageviews: pv,
    sessions,
    bounce_rate: bounceRate,
    avg_session_duration: durationStat?.avg_session_duration ?? 0,
    visitors_change: prevVis > 0 ? ((vis - prevVis) / prevVis) * 100 : 0,
    pageviews_change: prevPv > 0 ? ((pv - prevPv) / prevPv) * 100 : 0,
  };
}

export async function getTimeseries(
  db: D1Database,
  siteId: string,
  from: string,
  to: string,
  interval: 'hour' | 'day',
): Promise<TimeseriesPoint[]> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);

  // Separate query strings to avoid any SQL interpolation
  const query = interval === 'hour'
    ? `SELECT strftime('%Y-%m-%d %H:00', datetime(timestamp / 1000, 'unixepoch')) as bucket,
       COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
       GROUP BY bucket ORDER BY bucket`
    : `SELECT strftime('%Y-%m-%d', datetime(timestamp / 1000, 'unixepoch')) as bucket,
       COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
       GROUP BY bucket ORDER BY bucket`;

  const { results } = await db.prepare(query).bind(siteId, fromTs, toTs).all<TimeseriesPoint>();
  return results;
}

export async function getTopPages(
  db: D1Database,
  siteId: string,
  from: string,
  to: string,
  limit: number,
): Promise<PageStats[]> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);

  const { results } = await db.prepare(
    `SELECT url, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors, 0 as avg_time
     FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
     GROUP BY url ORDER BY views DESC LIMIT ?`,
  ).bind(siteId, fromTs, toTs, limit).all<PageStats>();

  return results;
}

export async function getTrafficSources(
  db: D1Database,
  siteId: string,
  from: string,
  to: string,
): Promise<{ referrers: SourceStats[]; utm: SourceStats[] }> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);

  // Parallel queries for referrers and UTM
  const [{ results: referrers }, { results: utm }] = await Promise.all([
    db.prepare(
      `SELECT COALESCE(referrer, '(direct)') as source, COUNT(DISTINCT session_id) as visitors, COUNT(*) as pageviews
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
       GROUP BY referrer ORDER BY visitors DESC LIMIT 20`,
    ).bind(siteId, fromTs, toTs).all<SourceStats>(),

    db.prepare(
      `SELECT COALESCE(utm_source, '(none)') || ' / ' || COALESCE(utm_medium, '(none)') as source,
       COUNT(DISTINCT session_id) as visitors, COUNT(*) as pageviews
       FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
       AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL)
       GROUP BY utm_source, utm_medium ORDER BY visitors DESC LIMIT 20`,
    ).bind(siteId, fromTs, toTs).all<SourceStats>(),
  ]);

  return { referrers, utm };
}

export async function getCustomEvents(
  db: D1Database,
  siteId: string,
  from: string,
  to: string,
  name?: string,
  limit = 50,
): Promise<{ events: Array<{ event_name: string; count: number; properties: Record<string, string | number> }> }> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);

  if (name) {
    const { results } = await db.prepare(
      `SELECT event_name, event_props, COUNT(*) as count FROM events
       WHERE site_id = ? AND type = 'custom' AND event_name = ? AND timestamp >= ? AND timestamp <= ?
       GROUP BY event_props ORDER BY count DESC LIMIT ?`,
    ).bind(siteId, name, fromTs, toTs, limit).all<{ event_name: string; event_props: string | null; count: number }>();

    return {
      events: results.map((r) => ({
        event_name: r.event_name,
        count: r.count,
        properties: r.event_props ? (JSON.parse(r.event_props) as Record<string, string | number>) : {},
      })),
    };
  }

  const { results } = await db.prepare(
    `SELECT event_name, COUNT(*) as count FROM events
     WHERE site_id = ? AND type = 'custom' AND timestamp >= ? AND timestamp <= ?
     GROUP BY event_name ORDER BY count DESC LIMIT ?`,
  ).bind(siteId, fromTs, toTs, limit).all<{ event_name: string; count: number }>();

  return {
    events: results.map((r) => ({ event_name: r.event_name, count: r.count, properties: {} })),
  };
}

export async function getActiveVisitors(db: D1Database, siteId: string): Promise<number> {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const result = await db.prepare(
    'SELECT COUNT(DISTINCT session_id) as active FROM events WHERE site_id = ? AND timestamp > ?',
  ).bind(siteId, fiveMinAgo).first<{ active: number }>();
  return result?.active ?? 0;
}

export async function getFunnelConversion(
  db: D1Database,
  siteId: string,
  steps: Array<{ type: 'url' | 'event'; value: string }>,
  from: string,
  to: string,
): Promise<Array<{ step: number; name: string; visitors: number; conversion: number }>> {
  const fromTs = dateToTimestamp(from);
  const toTs = endOfDay(to);
  const results: Array<{ step: number; name: string; visitors: number; conversion: number }> = [];
  let previousSessions: string[] | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const query = step.type === 'url'
      ? `SELECT DISTINCT session_id FROM events
         WHERE site_id = ? AND timestamp >= ? AND timestamp <= ? AND url LIKE ?`
      : `SELECT DISTINCT session_id FROM events
         WHERE site_id = ? AND type = 'custom' AND timestamp >= ? AND timestamp <= ? AND event_name = ?`;

    const { results: rows } = await db.prepare(query)
      .bind(siteId, fromTs, toTs, step.type === 'url' ? `%${step.value}%` : step.value)
      .all<{ session_id: string }>();

    let currentSessions = rows.map((r) => r.session_id);

    if (previousSessions !== null) {
      const prevSet = new Set(previousSessions);
      currentSessions = currentSessions.filter((s) => prevSet.has(s));
    }

    const visitors = currentSessions.length;
    const firstStepVisitors = results.length > 0 ? results[0].visitors : visitors;

    results.push({
      step: i + 1,
      name: step.value,
      visitors,
      conversion: firstStepVisitors > 0 ? (visitors / firstStepVisitors) * 100 : 0,
    });

    previousSessions = currentSessions;
  }

  return results;
}
