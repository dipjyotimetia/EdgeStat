import type { Env } from '../lib/types.js';
import { createSiteSchema, toParseResult, type Site } from '@edgestat/schemas';
import { requireMasterKey } from '../lib/auth.js';
import { jsonResponse, validationErrorResponse, invalidJsonBodyResponse } from '../lib/response.js';
import { generateShortId } from '../lib/utils.js';

export async function handleListSites(request: Request, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  const { results } = await env.DB.prepare(
    'SELECT id, name, domain, api_key, created_at FROM sites ORDER BY created_at DESC',
  ).all<Site>();

  return jsonResponse({ sites: results });
}

export async function handleCreateSite(request: Request, env: Env): Promise<Response> {
  const authError = requireMasterKey(request, env);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJsonBodyResponse();
  }

  const result = toParseResult(createSiteSchema.safeParse(body));
  if (!result.success) return validationErrorResponse(result.issues);

  const { name, domain } = result.data;
  const id = generateShortId();
  const apiKey = `es_${crypto.randomUUID().replace(/-/g, '')}`;

  await env.DB.prepare(
    'INSERT INTO sites (id, name, domain, api_key) VALUES (?, ?, ?, ?)',
  ).bind(id, name, domain, apiKey).run();

  const site: Site = { id, name, domain, api_key: apiKey, created_at: new Date().toISOString() };
  const snippet = `<script defer data-site="${id}" src="https://${domain}/s.js"></script>`;

  return jsonResponse({ site, snippet }, 201);
}
