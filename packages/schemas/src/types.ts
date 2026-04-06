// ─── Primitive const arrays (canonical source — Zod enums and SDK types derive from these) ──

export const EVENT_TYPES = [
  'pageview', 'session_start', 'session_end', 'custom', 'web_vital',
] as const;

export const VITAL_NAMES = ['FCP', 'LCP', 'CLS', 'FID', 'INP', 'TTFB'] as const;

export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;

export const INTERVALS = ['hour', 'day'] as const;

// ─── Derived union types ──────────────────────────────────────────────────────

export type EventType  = typeof EVENT_TYPES[number];
export type VitalName  = typeof VITAL_NAMES[number];
export type DeviceType = typeof DEVICE_TYPES[number];
export type Interval   = typeof INTERVALS[number];

// ─── Core event payload (replaces SDK's hand-written EventPayload) ────────────

export interface EventPayload {
  type: EventType;
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  event_name?: string;
  event_props?: Record<string, string | number>;
  vital_name?: VitalName;
  vital_value?: number;
  screen_width?: number;
  screen_height?: number;
  timestamp?: number;
}

// ─── HTTP error response shapes (discriminated by `status`) ──────────────────

export interface ValidationErrorResponse {
  error: 'validation_failed';
  status: 400;
  issues: Array<{ path: string; message: string; code: string }>;
}

export interface UnauthorizedErrorResponse {
  error: 'unauthorized';
  status: 401;
}

export interface NotFoundErrorResponse {
  error: 'not_found';
  status: 404;
  resource?: string;
}

export interface RateLimitErrorResponse {
  error: 'rate_limited';
  status: 429;
  retry_after?: number;
}

export interface ServerErrorResponse {
  error: 'internal_server_error';
  status: 500;
}

export type ApiErrorResponse =
  | ValidationErrorResponse
  | UnauthorizedErrorResponse
  | NotFoundErrorResponse
  | RateLimitErrorResponse
  | ServerErrorResponse;

// ─── Zod parse result envelope (browser-safe, mirrors Zod's SafeParseReturnType) ─

export interface ParseIssue {
  path: (string | number)[];
  message: string;
  code: string;
}

export interface ParseSuccess<T> {
  success: true;
  data: T;
}

export interface ParseFailure {
  success: false;
  issues: ParseIssue[];
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure;
