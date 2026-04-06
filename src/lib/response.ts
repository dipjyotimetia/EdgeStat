import type { ApiErrorResponse } from '@edgestat/schemas/types';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function errorResponse(body: ApiErrorResponse): Response {
  return new Response(JSON.stringify(body), { status: body.status, headers: JSON_HEADERS });
}
