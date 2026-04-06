import type { ApiErrorResponse, ParseIssue } from '@edgestat/schemas/types';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function errorResponse(body: ApiErrorResponse): Response {
  return new Response(JSON.stringify(body), { status: body.status, headers: JSON_HEADERS });
}

export function validationErrorResponse(issues: ParseIssue[]): Response {
  return errorResponse({
    error: 'validation_failed',
    status: 400,
    issues: issues.map((i) => ({ path: i.path.join('.'), message: i.message, code: i.code })),
  });
}

export function invalidJsonBodyResponse(): Response {
  return errorResponse({
    error: 'validation_failed',
    status: 400,
    issues: [{ path: '', message: 'Invalid JSON body', code: 'invalid_type' }],
  });
}
