import type { Env } from '../lib/types.js';
import { rotateSalt } from '../lib/privacy.js';

interface SiteRow {
  id: string;
}

export async function handleScheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  switch (controller.cron) {
    case '0 0 * * *':
      await rotateSalt(env.KV);
      console.log('Salt rotated successfully');
      break;

    case '30 0 * * *':
      await computeDailyAggregates(env);
      ctx.waitUntil(archiveToR2(env).catch((err) => console.error('R2 archive failed:', err)));
      break;

    case '0 */6 * * *':
      await purgeOldEvents(env);
      break;

    default:
      console.log('Unknown cron schedule:', controller.cron);
  }
}

async function computeDailyAggregates(env: Env): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const date = yesterday.toISOString().split('T')[0];
  const fromTs = new Date(date + 'T00:00:00Z').getTime();
  const toTs = new Date(date + 'T23:59:59.999Z').getTime();

  const { results: sites } = await env.DB
    .prepare('SELECT id FROM sites')
    .all<SiteRow>();

  for (const site of sites) {
    const siteId = site.id;

    try {
      // Run all 5 read queries in parallel
      const [stats, sessionData, duration, topPage, topReferrer] = await Promise.all([
        env.DB.prepare(
          `SELECT COUNT(*) as pageviews, COUNT(DISTINCT session_id) as visitors
           FROM events WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?`,
        ).bind(siteId, fromTs, toTs).first<{ pageviews: number; visitors: number }>(),

        env.DB.prepare(
          `SELECT COUNT(*) as total, SUM(CASE WHEN pv_count = 1 THEN 1 ELSE 0 END) as bounced
           FROM (SELECT session_id, COUNT(*) as pv_count FROM events
                 WHERE site_id = ? AND type = 'pageview' AND timestamp >= ? AND timestamp <= ?
                 GROUP BY session_id)`,
        ).bind(siteId, fromTs, toTs).first<{ total: number; bounced: number }>(),

        env.DB.prepare(
          `SELECT AVG(dur) as avg_dur FROM (
             SELECT (MAX(timestamp) - MIN(timestamp)) / 1000.0 as dur FROM events
             WHERE site_id = ? AND timestamp >= ? AND timestamp <= ?
             GROUP BY session_id HAVING COUNT(*) > 1)`,
        ).bind(siteId, fromTs, toTs).first<{ avg_dur: number }>(),

        env.DB.prepare(
          `SELECT url FROM events WHERE site_id = ? AND type = 'pageview'
           AND timestamp >= ? AND timestamp <= ?
           GROUP BY url ORDER BY COUNT(*) DESC LIMIT 1`,
        ).bind(siteId, fromTs, toTs).first<{ url: string }>(),

        env.DB.prepare(
          `SELECT referrer FROM events WHERE site_id = ? AND type = 'pageview'
           AND referrer IS NOT NULL AND timestamp >= ? AND timestamp <= ?
           GROUP BY referrer ORDER BY COUNT(*) DESC LIMIT 1`,
        ).bind(siteId, fromTs, toTs).first<{ referrer: string }>(),
      ]);

      const sessions = sessionData?.total ?? 0;
      const bounceRate = sessions > 0 ? (sessionData?.bounced ?? 0) / sessions : 0;

      await env.DB.prepare(
        `INSERT INTO daily_stats (site_id, date, visitors, pageviews, sessions, bounce_rate, avg_session_duration, top_page, top_referrer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(site_id, date) DO UPDATE SET
           visitors=excluded.visitors, pageviews=excluded.pageviews, sessions=excluded.sessions,
           bounce_rate=excluded.bounce_rate, avg_session_duration=excluded.avg_session_duration,
           top_page=excluded.top_page, top_referrer=excluded.top_referrer`,
      ).bind(
        siteId, date, stats?.visitors ?? 0, stats?.pageviews ?? 0,
        sessions, bounceRate, duration?.avg_dur ?? 0,
        topPage?.url ?? null, topReferrer?.referrer ?? null,
      ).run();

      await env.KV.put(
        `daily:${siteId}:${date}`,
        JSON.stringify({
          visitors: stats?.visitors ?? 0, pageviews: stats?.pageviews ?? 0,
          sessions, bounce_rate: bounceRate, avg_session_duration: duration?.avg_dur ?? 0,
        }),
        { expirationTtl: 86400 * 90 },
      );
    } catch (err) {
      console.error(`Failed to compute daily aggregates for site ${siteId}:`, err);
    }
  }

  console.log(`Daily aggregates computed for ${sites.length} sites`);
}

// Bug #12 fix: paginate R2 archive to avoid loading all events into memory
async function archiveToR2(env: Env): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const date = yesterday.toISOString().split('T')[0];
  const [year, month, day] = date.split('-');
  const fromTs = new Date(date + 'T00:00:00Z').getTime();
  const toTs = new Date(date + 'T23:59:59.999Z').getTime();

  const { results: sites } = await env.DB
    .prepare('SELECT id FROM sites')
    .all<SiteRow>();

  const PAGE_SIZE = 5000;

  for (const site of sites) {
    const chunks: string[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { results: events } = await env.DB
        .prepare(
          'SELECT * FROM events WHERE site_id = ? AND timestamp >= ? AND timestamp <= ? LIMIT ? OFFSET ?',
        )
        .bind(site.id, fromTs, toTs, PAGE_SIZE, offset)
        .all();

      if (events.length === 0) break;
      chunks.push(events.map((e) => JSON.stringify(e)).join('\n'));
      offset += events.length;
      hasMore = events.length === PAGE_SIZE;
    }

    if (chunks.length === 0) continue;

    const ndjson = chunks.join('\n');
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' });
    const compressed = blob.stream().pipeThrough(new CompressionStream('gzip'));

    const key = `archives/${site.id}/${year}/${month}/${day}/events.ndjson.gz`;
    await env.R2.put(key, compressed, {
      httpMetadata: { contentType: 'application/gzip' },
      customMetadata: { date, event_count: String(offset) },
    });

    console.log(`Archived ${offset} events for site ${site.id} to R2`);
  }
}

async function purgeOldEvents(env: Env): Promise<void> {
  const retentionDays = parseInt(env.RETENTION_DAYS || '30', 10);
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const BATCH_SIZE = 1000;

  let deleted = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await env.DB
      .prepare(
        `DELETE FROM events WHERE id IN (
          SELECT id FROM events WHERE timestamp < ? LIMIT ?
        )`,
      )
      .bind(cutoff, BATCH_SIZE)
      .run();

    const rowsDeleted = result.meta?.changes ?? 0;
    deleted += rowsDeleted;
    hasMore = rowsDeleted === BATCH_SIZE;
  }

  if (deleted > 0) {
    console.log(`Purged ${deleted} events older than ${retentionDays} days`);
  }
}
