import createClient, { type Middleware } from 'openapi-fetch';
import type { paths, components } from './schema';
import type { ApiErrorResponse } from '@edgestat/schemas/types';

function getMasterKey(): string {
  return localStorage.getItem('edgestat_master_key') || '';
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set('Authorization', `Bearer ${getMasterKey()}`);
    return request;
  },
};

// Type-safe API client generated from OpenAPI spec
export const api = createClient<paths>({ baseUrl: '/' });
api.use(authMiddleware);

// ─── Re-export component types for use in components ────────────────────────

export type Site          = components['schemas']['Site'];
export type StatsData     = components['schemas']['StatsResponse'];
export type TimeseriesPoint = components['schemas']['TimeseriesPoint'];
export type PageData      = components['schemas']['PageStats'];
export type SourceData    = components['schemas']['SourceStats'];
export type EventData     = components['schemas']['CustomEvent'];
export type FunnelData    = components['schemas']['Funnel'];
export type FunnelStep    = components['schemas']['FunnelStep'];

// ─── Re-export shared constants and error types ──────────────────────────────

export type { ApiErrorResponse, VitalName, EventType } from '@edgestat/schemas/types';
export { VITAL_NAMES, EVENT_TYPES, INTERVALS } from '@edgestat/schemas/types';

// ─── Helper ──────────────────────────────────────────────────────────────────

function unwrap<T>(result: { data?: T; error?: ApiErrorResponse; response: Response }): T {
  if (result.error || !result.data) {
    const err = result.error;
    if (err) throw Object.assign(new Error(err.error), err);
    throw new Error(`HTTP ${result.response.status}`);
  }
  return result.data;
}

// ─── Typed API functions ──────────────────────────────────────────────────────

export async function listSites() {
  return unwrap(await api.GET('/api/sites'));
}

export async function createSite(name: string, domain: string) {
  return unwrap(await api.POST('/api/sites', { body: { name, domain } }));
}

export async function getStats(siteId: string, from: string, to: string) {
  return unwrap(await api.GET('/api/sites/{siteId}/stats', {
    params: { path: { siteId }, query: { from, to } },
  }));
}

export async function getTimeseries(
  siteId: string, from: string, to: string, interval: 'hour' | 'day' = 'day',
) {
  return unwrap(await api.GET('/api/sites/{siteId}/timeseries', {
    params: { path: { siteId }, query: { from, to, interval } },
  }));
}

export async function getPages(siteId: string, from: string, to: string, limit = 10) {
  return unwrap(await api.GET('/api/sites/{siteId}/pages', {
    params: { path: { siteId }, query: { from, to, limit } },
  }));
}

export async function getSources(siteId: string, from: string, to: string) {
  return unwrap(await api.GET('/api/sites/{siteId}/sources', {
    params: { path: { siteId }, query: { from, to } },
  }));
}

export async function getEvents(siteId: string, from: string, to: string, name?: string) {
  return unwrap(await api.GET('/api/sites/{siteId}/events', {
    params: { path: { siteId }, query: { from, to, name, limit: 50 } },
  }));
}

export async function getRealtime(siteId: string) {
  return unwrap(await api.GET('/api/sites/{siteId}/realtime', {
    params: { path: { siteId } },
  }));
}

export async function getFunnels(siteId: string) {
  return unwrap(await api.GET('/api/sites/{siteId}/funnels', {
    params: { path: { siteId } },
  }));
}

export async function createFunnel(siteId: string, name: string, steps: FunnelStep[]) {
  return unwrap(await api.POST('/api/sites/{siteId}/funnels', {
    params: { path: { siteId } },
    body: { name, steps },
  }));
}
