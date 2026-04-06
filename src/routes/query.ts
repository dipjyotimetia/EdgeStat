import type { Env } from '../lib/types.js';
import { requireMasterKey } from '../lib/auth.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { defaultDateRange } from '../lib/utils.js';
import { generateShortId } from '../lib/utils.js';
import {
  dateRangeSchema,
  timeseriesQuerySchema,
  pagesQuerySchema,
  eventsQuerySchema,
  createFunnelSchema,
  funnelSchema,
  type StatsResponse,
  type TimeseriesResponse,
  type PagesResponse,
  type SourcesResponse,
  type EventsResponse,
  type RealtimeResponse,
  type FunnelsResponse,
  type CreateFunnelResponse,
} from '../lib/schemas.js';
import {
  getOverviewStats,
  getTimeseries,
  getTopPages,
  getTrafficSources,
  getCustomEvents,
  getActiveVisitors,
} from '../lib/aggregation.js';
import type { IRequest } from 'itty-router';

function getQuery(request: IRequest): Record<string, string> {
  return (request.query as Record<string, string>) ?? {};
}

function getSiteId(request: IRequest): string {
  return request.params?.id ?? '';
}

export async function handleStats(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const parsed = dateRangeSchema.safeParse(query.from && query.to ? query : defaultDateRange());
  if (!parsed.success) return errorResponse('Invalid date range', 400);

  const stats: StatsResponse = await getOverviewStats(env.DB, siteId, parsed.data.from, parsed.data.to);
  return jsonResponse(stats);
}

export async function handleTimeseries(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const parsed = timeseriesQuerySchema.safeParse(query.from && query.to ? query : { ...defaultDateRange(), interval: 'day' });
  if (!parsed.success) return errorResponse('Invalid query parameters', 400);

  const data = await getTimeseries(env.DB, siteId, parsed.data.from, parsed.data.to, parsed.data.interval);
  return jsonResponse<TimeseriesResponse>({ data });
}

export async function handlePages(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const parsed = pagesQuerySchema.safeParse(query.from && query.to ? query : { ...defaultDateRange(), limit: '10' });
  if (!parsed.success) return errorResponse('Invalid query parameters', 400);

  const pages = await getTopPages(env.DB, siteId, parsed.data.from, parsed.data.to, parsed.data.limit);
  return jsonResponse<PagesResponse>({ pages });
}

export async function handleSources(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const parsed = dateRangeSchema.safeParse(query.from && query.to ? query : defaultDateRange());
  if (!parsed.success) return errorResponse('Invalid date range', 400);

  const sources: SourcesResponse = await getTrafficSources(env.DB, siteId, parsed.data.from, parsed.data.to);
  return jsonResponse(sources);
}

export async function handleEvents(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const parsed = eventsQuerySchema.safeParse(query.from && query.to ? query : { ...defaultDateRange(), limit: '50' });
  if (!parsed.success) return errorResponse('Invalid query parameters', 400);

  const events: EventsResponse = await getCustomEvents(
    env.DB, siteId, parsed.data.from, parsed.data.to, parsed.data.name, parsed.data.limit,
  );
  return jsonResponse(events);
}

export async function handleRealtime(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const active = await getActiveVisitors(env.DB, siteId);
  return jsonResponse<RealtimeResponse>({ active });
}

export async function handleFunnels(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const { results } = await env.DB
    .prepare('SELECT id, name, steps, created_at FROM funnels WHERE site_id = ? ORDER BY created_at DESC')
    .bind(siteId)
    .all();

  const funnels = results.map((f: Record<string, unknown>) => {
    const parsed = funnelSchema.safeParse({
      ...f,
      steps: typeof f.steps === 'string' ? JSON.parse(f.steps) : f.steps,
    });
    return parsed.success ? parsed.data : null;
  }).filter((f): f is NonNullable<typeof f> => f !== null);

  return jsonResponse<FunnelsResponse>({ funnels });
}

export async function handleCreateFunnel(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);

  let body: unknown;
  try {
    body = await (request as unknown as Request).json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const parsed = createFunnelSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Validation failed', 400, parsed.error.flatten().fieldErrors);
  }

  const { name, steps } = parsed.data;
  const id = generateShortId();

  await env.DB
    .prepare('INSERT INTO funnels (id, site_id, name, steps) VALUES (?, ?, ?, ?)')
    .bind(id, siteId, name, JSON.stringify(steps))
    .run();

  return jsonResponse<CreateFunnelResponse>({ id, name, steps }, 201);
}
