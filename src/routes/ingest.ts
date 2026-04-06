import type { Env, AnalyticsEvent, QueueMessage } from '../lib/types.js';
import { ingestBodySchema } from '../lib/schemas.js';
import { generateSessionId, getCurrentSalt } from '../lib/privacy.js';
import { parseUserAgent } from '../lib/ua-parser.js';
import { validateSiteApiKey } from '../lib/auth.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

export async function handleIngestOptions(): Promise<Response> {
  return new Response(null, { status: 204 });
}

export async function handleIngest(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = ingestBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { site_id, events } = parsed.data;

  const siteValid = await validateSiteApiKey(env.DB, site_id);
  if (!siteValid) {
    return errorResponse('Unknown site_id', 404);
  }

  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ua = request.headers.get('user-agent') || '';
  const salt = await getCurrentSalt(env.KV);
  const sessionId = await generateSessionId(ip, ua, salt);
  const { browser, device_type } = parseUserAgent(ua);
  const cfData = (request as unknown as { cf?: { country?: string } }).cf;
  const country = cfData?.country ?? 'XX';

  const enrichedEvents: AnalyticsEvent[] = events.map((event) => ({
    site_id,
    type: event.type,
    url: event.url ?? '',
    referrer: event.referrer,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    device_type,
    browser,
    country,
    screen_width: event.screen_width,
    screen_height: event.screen_height,
    event_name: event.event_name,
    event_props: event.event_props,
    vital_name: event.vital_name,
    vital_value: event.vital_value,
    session_id: sessionId,
    timestamp: event.timestamp ?? Date.now(),
  }));

  const message: QueueMessage = { site_id, events: enrichedEvents, received_at: Date.now() };
  await env.EVENTS_QUEUE.send(message);

  return jsonResponse({ queued: events.length }, 202);
}
