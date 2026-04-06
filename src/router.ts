import { AutoRouter, cors, error } from 'itty-router';
import type { Env } from './lib/types.js';
import { openApiDocument } from '@edgestat/schemas';
import { handleIngest, handleIngestOptions } from './routes/ingest.js';
import { handleCreateSite, handleListSites } from './routes/setup.js';
import {
  handleStats,
  handleTimeseries,
  handlePages,
  handleSources,
  handleEvents,
  handleRealtime,
  handleFunnels,
  handleCreateFunnel,
} from './routes/query.js';
import { handleSSE } from './routes/sse.js';

const { preflight, corsify } = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Site-ID'],
});

const router = AutoRouter({
  before: [preflight],
  after: [corsify],
  catch: (err) => error(500, { error: err instanceof Error ? err.message : 'Internal Server Error' }),
});

// ─── OpenAPI spec (JSON) ────────────────────────────────────────────────────
router.get('/api/openapi.json', () => {
  return new Response(JSON.stringify(openApiDocument, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

// ─── Scalar API docs UI ─────────────────────────────────────────────────────
router.get('/api/docs', () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EdgeStat API Reference</title>
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  <script>
    Scalar.createApiReference('#app', {
      url: '/api/openapi.json',
      theme: 'kepler',
      customCss: \`
        .dark-mode {
          --scalar-background-1: #050B14;
          --scalar-background-2: #0A2540;
          --scalar-background-3: #0D3D30;
          --scalar-color-1: #E2F9F5;
          --scalar-color-2: #7FFFD4;
          --scalar-color-3: #1E6B5A;
          --scalar-color-accent: #00D4AA;
        }
      \`,
    })
  </script>
</body>
</html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});

// ─── Ingest (public) ────────────────────────────────────────────────────────
router.options('/v1/events', handleIngestOptions);
router.post('/v1/events', handleIngest);

// ─── Site management (authed) ───────────────────────────────────────────────
router.get('/api/sites', handleListSites);
router.post('/api/sites', handleCreateSite);

// ─── Analytics queries (authed) ─────────────────────────────────────────────
router.get('/api/sites/:id/stats', handleStats);
router.get('/api/sites/:id/timeseries', handleTimeseries);
router.get('/api/sites/:id/pages', handlePages);
router.get('/api/sites/:id/sources', handleSources);
router.get('/api/sites/:id/events', handleEvents);
router.get('/api/sites/:id/realtime', handleRealtime);
router.get('/api/sites/:id/funnels', handleFunnels);
router.post('/api/sites/:id/funnels', handleCreateFunnel);

// ─── SSE real-time stream ───────────────────────────────────────────────────
router.get('/sse/sites/:id/live', handleSSE);

// ─── Tracking snippet ───────────────────────────────────────────────────────
router.get('/s.js', async (_req: Request, env: Env) => {
  return env.ASSETS.fetch(new Request('https://edgestat/s.js'));
});

export { router };
