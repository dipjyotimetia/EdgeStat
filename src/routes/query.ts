import type { Env } from '../lib/types.js';
import { requireMasterKey } from '../lib/auth.js';
import { jsonResponse, validationErrorResponse, invalidJsonBodyResponse } from '../lib/response.js';
import { defaultDateRange } from '../lib/utils.js';
import { generateShortId } from '../lib/utils.js';
import {
  dateRangeSchema,
  timeseriesQuerySchema,
  pagesQuerySchema,
  eventsQuerySchema,
  createFunnelSchema,
  funnelSchema,
  toParseResult,
  type StatsResponse,
  type TimeseriesResponse,
  type PagesResponse,
  type SourcesResponse,
  type EventsResponse,
  type RealtimeResponse,
  type FunnelsResponse,
  type CreateFunnelResponse,
} from '@edgestat/schemas';
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
  const result = toParseResult(
    dateRangeSchema.safeParse(query.from && query.to ? query : defaultDateRange())
  );
  if (!result.success) return validationErrorResponse(result.issues);

  const stats: StatsResponse = await getOverviewStats(
    env.DB,
    siteId,
    result.data.from,
    result.data.to
  );
  return jsonResponse(stats);
}

export async function handleTimeseries(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const result = toParseResult(
    timeseriesQuerySchema.safeParse(
      query.from && query.to ? query : { ...defaultDateRange(), interval: 'day' }
    )
  );
  if (!result.success) return validationErrorResponse(result.issues);

  const data = await getTimeseries(
    env.DB,
    siteId,
    result.data.from,
    result.data.to,
    result.data.interval
  );
  return jsonResponse<TimeseriesResponse>({ data });
}

export async function handlePages(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const result = toParseResult(
    pagesQuerySchema.safeParse(
      query.from && query.to ? query : { ...defaultDateRange(), limit: '10' }
    )
  );
  if (!result.success) return validationErrorResponse(result.issues);

  const pages = await getTopPages(
    env.DB,
    siteId,
    result.data.from,
    result.data.to,
    result.data.limit
  );
  return jsonResponse<PagesResponse>({ pages });
}

export async function handleSources(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const result = toParseResult(
    dateRangeSchema.safeParse(query.from && query.to ? query : defaultDateRange())
  );
  if (!result.success) return validationErrorResponse(result.issues);

  const sources: SourcesResponse = await getTrafficSources(
    env.DB,
    siteId,
    result.data.from,
    result.data.to
  );
  return jsonResponse(sources);
}

export async function handleEvents(request: IRequest, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const siteId = getSiteId(request);
  const query = getQuery(request);
  const result = toParseResult(
    eventsQuerySchema.safeParse(
      query.from && query.to ? query : { ...defaultDateRange(), limit: '50' }
    )
  );
  if (!result.success) return validationErrorResponse(result.issues);

  const events: EventsResponse = await getCustomEvents(
    env.DB,
    siteId,
    result.data.from,
    result.data.to,
    result.data.name,
    result.data.limit
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
  const { results } = await env.DB.prepare(
    'SELECT id, name, steps, created_at FROM funnels WHERE site_id = ? ORDER BY created_at DESC'
  )
    .bind(siteId)
    .all();

  const funnels = results
    .map((f: Record<string, unknown>) => {
      const parsed = funnelSchema.safeParse({
        ...f,
        steps: typeof f.steps === 'string' ? JSON.parse(f.steps) : f.steps,
      });
      return parsed.success ? parsed.data : null;
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

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
    return invalidJsonBodyResponse();
  }

  const result = toParseResult(createFunnelSchema.safeParse(body));
  if (!result.success) return validationErrorResponse(result.issues);

  const { name, steps } = result.data;
  const id = generateShortId();

  await env.DB.prepare('INSERT INTO funnels (id, site_id, name, steps) VALUES (?, ?, ?, ?)')
    .bind(id, siteId, name, JSON.stringify(steps))
    .run();

  return jsonResponse<CreateFunnelResponse>({ id, name, steps }, 201);
}
