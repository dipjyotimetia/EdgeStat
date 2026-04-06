import type { ErrorResponse } from './schemas.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function errorResponse(error: string, status: number, details?: Record<string, unknown>): Response {
  const body: ErrorResponse = details ? { error, details } : { error };
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
