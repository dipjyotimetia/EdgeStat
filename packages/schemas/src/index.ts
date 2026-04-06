import { z } from 'zod';
import { createDocument } from 'zod-openapi';

export * from './types.js';
import {
  EVENT_TYPES,
  VITAL_NAMES,
  DEVICE_TYPES,
  INTERVALS,
  type ParseResult,
} from './types.js';

// ─── Zod Enums (derived from const arrays — never hardcoded) ─────────────────

export const eventTypeEnum  = z.enum(EVENT_TYPES);
export const vitalNameEnum  = z.enum(VITAL_NAMES);
export const deviceTypeEnum = z.enum(DEVICE_TYPES);
export const intervalEnum   = z.enum(INTERVALS);

// ─── Reusable Field Schemas ───────────────────────────────────────────────────

const dateString  = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const siteIdParam = z.string().min(1).max(64);

const eventPropsSchema = z
  .record(z.string().max(64), z.union([z.string().max(256), z.number()]))
  .check((ctx) => {
    if (Object.keys(ctx.value).length > 10) {
      ctx.issues.push({ input: ctx.value, message: 'Maximum 10 event properties allowed', code: 'custom' });
    }
  });

// ─── Request Schemas ──────────────────────────────────────────────────────────

export const singleEventSchema = z
  .object({
    type:          eventTypeEnum,
    url:           z.string().max(2048).optional(),
    referrer:      z.string().max(2048).optional(),
    utm_source:    z.string().max(256).optional(),
    utm_medium:    z.string().max(256).optional(),
    utm_campaign:  z.string().max(256).optional(),
    screen_width:  z.number().int().positive().optional(),
    screen_height: z.number().int().positive().optional(),
    event_name:    z.string().max(128).optional(),
    event_props:   eventPropsSchema.optional(),
    vital_name:    vitalNameEnum.optional(),
    vital_value:   z.number().optional(),
    timestamp:     z.number().int().positive().optional(),
  })
  .strict()
  .meta({ id: 'SingleEvent', description: 'A single analytics event' });

export const ingestBodySchema = z
  .object({
    site_id: siteIdParam,
    events:  z.array(singleEventSchema).min(1).max(20),
  })
  .strict()
  .meta({ id: 'IngestBody', description: 'Batch of events to ingest' });

export const createSiteSchema = z
  .object({
    name:   z.string().min(1).max(128),
    domain: z.string().min(1).max(256),
  })
  .strict()
  .meta({ id: 'CreateSiteBody' });

export const createFunnelSchema = z
  .object({
    name:  z.string().min(1).max(128),
    steps: z
      .array(
        z.object({
          name:  z.string().min(1).max(128),
          type:  z.enum(['url', 'event']),
          value: z.string().min(1).max(512),
        }).strict(),
      )
      .min(2)
      .max(10),
  })
  .strict()
  .meta({ id: 'CreateFunnelBody' });

// ─── Query Param Schemas ──────────────────────────────────────────────────────

export const dateRangeSchema = z.object({
  from: dateString,
  to:   dateString,
});

export const timeseriesQuerySchema = dateRangeSchema.extend({
  interval: intervalEnum.default('day'),
});

export const pagesQuerySchema = dateRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const eventsQuerySchema = dateRangeSchema.extend({
  name:  z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const siteSchema = z.object({
  id:         z.string(),
  name:       z.string(),
  domain:     z.string(),
  api_key:    z.string(),
  created_at: z.string(),
}).meta({ id: 'Site' });

export const listSitesResponseSchema = z.object({
  sites: z.array(siteSchema),
}).meta({ id: 'ListSitesResponse' });

export const createSiteResponseSchema = z.object({
  site:    siteSchema,
  snippet: z.string(),
}).meta({ id: 'CreateSiteResponse' });

export const ingestResponseSchema = z.object({
  queued: z.number().int(),
}).meta({ id: 'IngestResponse' });

export const statsResponseSchema = z.object({
  visitors:             z.number().int(),
  pageviews:            z.number().int(),
  sessions:             z.number().int(),
  bounce_rate:          z.number().min(0).max(1),
  avg_session_duration: z.number(),
  visitors_change:      z.number(),
  pageviews_change:     z.number(),
}).meta({ id: 'StatsResponse' });

export const timeseriesPointSchema = z.object({
  bucket:    z.string(),
  visitors:  z.number().int(),
  pageviews: z.number().int(),
}).meta({ id: 'TimeseriesPoint' });

export const timeseriesResponseSchema = z.object({
  data: z.array(timeseriesPointSchema),
}).meta({ id: 'TimeseriesResponse' });

export const pageStatsSchema = z.object({
  url:      z.string(),
  views:    z.number().int(),
  visitors: z.number().int(),
  avg_time: z.number(),
}).meta({ id: 'PageStats' });

export const pagesResponseSchema = z.object({
  pages: z.array(pageStatsSchema),
}).meta({ id: 'PagesResponse' });

export const sourceStatsSchema = z.object({
  source:    z.string(),
  visitors:  z.number().int(),
  pageviews: z.number().int(),
}).meta({ id: 'SourceStats' });

export const sourcesResponseSchema = z.object({
  referrers: z.array(sourceStatsSchema),
  utm:       z.array(sourceStatsSchema),
}).meta({ id: 'SourcesResponse' });

export const customEventSchema = z.object({
  event_name:  z.string(),
  count:       z.number().int(),
  properties:  z.record(z.string(), z.union([z.string(), z.number()])),
}).meta({ id: 'CustomEvent' });

export const eventsResponseSchema = z.object({
  events: z.array(customEventSchema),
}).meta({ id: 'EventsResponse' });

export const realtimeResponseSchema = z.object({
  active: z.number().int(),
}).meta({ id: 'RealtimeResponse' });

export const funnelStepSchema = z.object({
  name:  z.string(),
  type:  z.enum(['url', 'event']),
  value: z.string(),
}).meta({ id: 'FunnelStep' });

export const funnelSchema = z.object({
  id:         z.string(),
  name:       z.string(),
  steps:      z.array(funnelStepSchema),
  created_at: z.string().optional(),
}).meta({ id: 'Funnel' });

export const funnelsResponseSchema = z.object({
  funnels: z.array(funnelSchema),
}).meta({ id: 'FunnelsResponse' });

export const createFunnelResponseSchema = z.object({
  id:    z.string(),
  name:  z.string(),
  steps: z.array(funnelStepSchema),
}).meta({ id: 'CreateFunnelResponse' });

export const sseEventSchema = z.object({
  type:      z.literal('visitors'),
  count:     z.number().int(),
  timestamp: z.number().int(),
}).meta({ id: 'SSEVisitorEvent' });

// ─── Typed Error Schemas (one per HTTP status code) ───────────────────────────

export const validationErrorSchema = z.object({
  error:  z.literal('validation_failed'),
  status: z.literal(400),
  issues: z.array(z.object({
    path:    z.string(),
    message: z.string(),
    code:    z.string(),
  })),
}).meta({ id: 'ValidationErrorResponse' });

export const unauthorizedErrorSchema = z.object({
  error:  z.literal('unauthorized'),
  status: z.literal(401),
}).meta({ id: 'UnauthorizedErrorResponse' });

export const notFoundErrorSchema = z.object({
  error:    z.literal('not_found'),
  status:   z.literal(404),
  resource: z.string().optional(),
}).meta({ id: 'NotFoundErrorResponse' });

export const rateLimitErrorSchema = z.object({
  error:       z.literal('rate_limited'),
  status:      z.literal(429),
  retry_after: z.number().optional(),
}).meta({ id: 'RateLimitErrorResponse' });

export const serverErrorSchema = z.object({
  error:  z.literal('internal_server_error'),
  status: z.literal(500),
}).meta({ id: 'ServerErrorResponse' });

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type SingleEvent           = z.infer<typeof singleEventSchema>;
export type IngestBody            = z.infer<typeof ingestBodySchema>;
export type CreateSiteBody        = z.infer<typeof createSiteSchema>;
export type CreateFunnelBody      = z.infer<typeof createFunnelSchema>;
export type DateRange             = z.infer<typeof dateRangeSchema>;
export type TimeseriesQuery       = z.infer<typeof timeseriesQuerySchema>;
export type PagesQuery            = z.infer<typeof pagesQuerySchema>;
export type EventsQuery           = z.infer<typeof eventsQuerySchema>;
export type Site                  = z.infer<typeof siteSchema>;
export type StatsResponse         = z.infer<typeof statsResponseSchema>;
export type TimeseriesPoint       = z.infer<typeof timeseriesPointSchema>;
export type TimeseriesResponse    = z.infer<typeof timeseriesResponseSchema>;
export type PageStats             = z.infer<typeof pageStatsSchema>;
export type PagesResponse         = z.infer<typeof pagesResponseSchema>;
export type SourceStats           = z.infer<typeof sourceStatsSchema>;
export type SourcesResponse       = z.infer<typeof sourcesResponseSchema>;
export type EventsResponse        = z.infer<typeof eventsResponseSchema>;
export type RealtimeResponse      = z.infer<typeof realtimeResponseSchema>;
export type Funnel                = z.infer<typeof funnelSchema>;
export type FunnelsResponse       = z.infer<typeof funnelsResponseSchema>;
export type CreateFunnelResponse  = z.infer<typeof createFunnelResponseSchema>;
export type SSEEvent              = z.infer<typeof sseEventSchema>;

// ─── Parse Result Utility ─────────────────────────────────────────────────────

type ZodSafeResult<T> = { success: true; data: T } | { success: false; error: z.ZodError<T> };

export function toParseResult<T>(result: ZodSafeResult<T>): ParseResult<T> {
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    issues: result.error.issues.map((issue: z.core.$ZodIssue) => ({
      path:    issue.path as (string | number)[],
      message: issue.message,
      code:    issue.code as string,
    })),
  };
}

// ─── OpenAPI Document ─────────────────────────────────────────────────────────

const authParam  = { security: [{ BearerAuth: [] as string[] }] };
const siteIdPath = { name: 'siteId', in: 'path' as const, required: true as const, schema: { type: 'string' as const } };
const fromQuery  = { name: 'from',  in: 'query' as const, schema: { type: 'string' as const } };
const toQuery    = { name: 'to',    in: 'query' as const, schema: { type: 'string' as const } };

const std401 = { description: 'Unauthorized', content: { 'application/json': { schema: unauthorizedErrorSchema } } } as const;
const std500 = { description: 'Server error', content: { 'application/json': { schema: serverErrorSchema } } } as const;
const std400 = { description: 'Validation error', content: { 'application/json': { schema: validationErrorSchema } } } as const;
const std404 = { description: 'Not found', content: { 'application/json': { schema: notFoundErrorSchema } } } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiDocument: any = createDocument({
  openapi: '3.1.0',
  info: {
    title:       'EdgeStat API',
    version:     '0.1.0',
    description: 'Privacy-first analytics engine on Cloudflare. Analytics at the edge. Owned by you.',
  },
  servers: [{ url: '/', description: 'Current deployment' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', description: 'Master API key' },
    },
  },
  paths: {
    '/v1/events': {
      post: {
        operationId: 'ingestEvents',
        summary:     'Ingest analytics events',
        tags:        ['Ingest'],
        requestBody: { required: true, content: { 'application/json': { schema: ingestBodySchema } } },
        responses: {
          '202': { description: 'Queued',            content: { 'application/json': { schema: ingestResponseSchema } } },
          '400': std400,
          '404': std404,
          '500': std500,
        },
      },
    },
    '/api/sites': {
      get: {
        operationId: 'listSites', summary: 'List all sites', tags: ['Sites'],
        ...authParam,
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: listSitesResponseSchema } } }, '401': std401, '500': std500 },
      },
      post: {
        operationId: 'createSite', summary: 'Create a new site', tags: ['Sites'],
        ...authParam,
        requestBody: { required: true, content: { 'application/json': { schema: createSiteSchema } } },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: createSiteResponseSchema } } }, '400': std400, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/stats': {
      get: {
        operationId: 'getStats', summary: 'Overview statistics', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath, fromQuery, toQuery],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: statsResponseSchema } } }, '401': std401, '404': std404, '500': std500 },
      },
    },
    '/api/sites/{siteId}/timeseries': {
      get: {
        operationId: 'getTimeseries', summary: 'Time-bucketed breakdown', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath, fromQuery, toQuery, { name: 'interval', in: 'query', schema: { type: 'string', enum: [...INTERVALS] } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: timeseriesResponseSchema } } }, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/pages': {
      get: {
        operationId: 'getPages', summary: 'Top pages', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath, fromQuery, toQuery, { name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: pagesResponseSchema } } }, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/sources': {
      get: {
        operationId: 'getSources', summary: 'Traffic sources', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath, fromQuery, toQuery],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: sourcesResponseSchema } } }, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/events': {
      get: {
        operationId: 'getEvents', summary: 'Custom events', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath, fromQuery, toQuery, { name: 'name', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: eventsResponseSchema } } }, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/realtime': {
      get: {
        operationId: 'getRealtime', summary: 'Active visitors', tags: ['Analytics'],
        ...authParam,
        parameters: [siteIdPath],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: realtimeResponseSchema } } }, '401': std401, '500': std500 },
      },
    },
    '/api/sites/{siteId}/funnels': {
      get: {
        operationId: 'listFunnels', summary: 'List funnels', tags: ['Funnels'],
        ...authParam,
        parameters: [siteIdPath],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: funnelsResponseSchema } } }, '401': std401, '500': std500 },
      },
      post: {
        operationId: 'createFunnel', summary: 'Create funnel', tags: ['Funnels'],
        ...authParam,
        parameters: [siteIdPath],
        requestBody: { required: true, content: { 'application/json': { schema: createFunnelSchema } } },
        responses: { '201': { description: 'Created', content: { 'application/json': { schema: createFunnelResponseSchema } } }, '400': std400, '401': std401, '500': std500 },
      },
    },
  },
});
