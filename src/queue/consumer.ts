import type { Env, AnalyticsEvent, QueueMessage } from '../lib/types.js';

export async function handleQueueBatch(
  batch: MessageBatch<QueueMessage>,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  // Process each message individually to correctly ack/retry
  for (const msg of batch.messages) {
    try {
      const { events } = msg.body;
      if (events.length === 0) {
        msg.ack();
        continue;
      }

      // Batch insert into D1
      const stmts = events.map((e) =>
        env.DB.prepare(
          `INSERT INTO events (
            site_id, type, url, referrer, utm_source, utm_medium, utm_campaign,
            device_type, browser, country, screen_width, screen_height,
            event_name, event_props, vital_name, vital_value, session_id, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          e.site_id,
          e.type,
          e.url || null,
          e.referrer || null,
          e.utm_source || null,
          e.utm_medium || null,
          e.utm_campaign || null,
          e.device_type || null,
          e.browser || null,
          e.country || null,
          e.screen_width || null,
          e.screen_height || null,
          e.event_name || null,
          e.event_props ? JSON.stringify(e.event_props) : null,
          e.vital_name || null,
          e.vital_value ?? null,
          e.session_id || null,
          e.timestamp,
        ),
      );

      // D1 batch is transactional - process in chunks of 100
      const CHUNK_SIZE = 100;
      for (let i = 0; i < stmts.length; i += CHUNK_SIZE) {
        await env.DB.batch(stmts.slice(i, i + CHUNK_SIZE));
      }

      // Only ack AFTER successful DB write
      msg.ack();

      // Fire-and-forget counter update
      ctx.waitUntil(updateCounters(env, events));
    } catch (err) {
      console.error('Queue consumer error:', err);
      msg.retry({ delaySeconds: 60 });
    }
  }
}

async function updateCounters(env: Env, events: AnalyticsEvent[]): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const bySite = new Map<string, AnalyticsEvent[]>();
    for (const e of events) {
      const existing = bySite.get(e.site_id) || [];
      existing.push(e);
      bySite.set(e.site_id, existing);
    }

    for (const [siteId, siteEvents] of bySite) {
      const pageviews = siteEvents.filter((e) => e.type === 'pageview').length;
      const sessions = new Set(siteEvents.map((e) => e.session_id)).size;

      const pvKey = `counter:${siteId}:${today}:pageviews`;
      const visKey = `counter:${siteId}:${today}:visitors`;

      const [rawPv, rawVis] = await Promise.all([env.KV.get(pvKey), env.KV.get(visKey)]);
      const currentPv = parseInt(rawPv || '0', 10);
      const currentVis = parseInt(rawVis || '0', 10);

      if (pageviews > 0) {
        await env.KV.put(pvKey, String(currentPv + pageviews), { expirationTtl: 172800 });
      }
      if (sessions > 0) {
        await env.KV.put(visKey, String(currentVis + sessions), { expirationTtl: 172800 });
      }
    }
  } catch (err) {
    console.error('Failed to update KV counters:', err);
  }
}
