import type { Env } from './types.js';
import { errorResponse } from './response.js';

interface HasHeaders {
  headers: { get(name: string): string | null };
}

export function requireMasterKey(request: HasHeaders, env: Env): Response | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse({ error: 'unauthorized', status: 401 });
  }

  const token = authHeader.slice(7);
  if (token !== env.MASTER_KEY) {
    return errorResponse({ error: 'unauthorized', status: 401 });
  }

  return null;
}

export async function validateSiteApiKey(
  db: D1Database,
  siteId: string,
): Promise<boolean> {
  const site = await db
    .prepare('SELECT id FROM sites WHERE id = ?')
    .bind(siteId)
    .first();
  return site !== null;
}
