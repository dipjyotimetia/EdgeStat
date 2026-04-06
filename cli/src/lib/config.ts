import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PLACEHOLDER = 'local-dev-placeholder';

/**
 * Walk up from startDir looking for wrangler.jsonc.
 * Returns the directory that contains it, or null if not found.
 * Defaults to process.cwd() so callers outside the repo work correctly.
 */
export function findProjectRoot(startDir?: string): string | null {
  let dir = resolve(startDir ?? process.cwd());
  const root = resolve('/');
  while (dir !== root) {
    if (existsSync(resolve(dir, 'wrangler.jsonc'))) return dir;
    dir = resolve(dir, '..');
  }
  return null;
}

export type WranglerConfigMode = 'project' | 'standalone';

/**
 * Write a wrangler.jsonc with placeholder IDs into dir.
 * Skips silently if the file already exists (race-condition guard).
 */
export function generateWranglerConfig(dir: string, mode: WranglerConfigMode): void {
  const configPath = resolve(dir, 'wrangler.jsonc');
  if (existsSync(configPath)) return;

  const today = new Date().toISOString().slice(0, 10);

  const base = {
    $schema: 'node_modules/wrangler/config-schema.json',
    name: 'edgestat',
    main: mode === 'project' ? 'src/index.ts' : 'worker.js',
    compatibility_date: today,
    d1_databases: [
      {
        binding: 'DB',
        database_name: 'edgestat-db',
        database_id: PLACEHOLDER,
        migrations_dir: mode === 'project' ? 'src/migrations' : 'migrations',
      },
    ],
    kv_namespaces: [{ binding: 'KV', id: PLACEHOLDER }],
    r2_buckets: [{ binding: 'R2', bucket_name: 'edgestat-archives' }],
    queues: {
      producers: [{ binding: 'EVENTS_QUEUE', queue: 'edgestat-events' }],
      consumers: [
        {
          queue: 'edgestat-events',
          max_batch_size: 100,
          max_batch_timeout: 60,
          max_retries: 3,
          dead_letter_queue: 'edgestat-events-dlq',
        },
      ],
    },
    triggers: { crons: ['0 0 * * *', '30 0 * * *', '0 */6 * * *'] },
    vars: { RETENTION_DAYS: '30', SESSION_TIMEOUT_MINUTES: '30' },
  };

  const withAssets =
    mode === 'project'
      ? {
          ...base,
          assets: {
            directory: './dashboard/dist',
            binding: 'ASSETS',
            not_found_handling: 'single-page-application',
            html_handling: 'auto-trailing-slash',
            run_worker_first: ['/v1/*', '/api/*', '/sse/*', '/s.js'],
          },
        }
      : base;

  // Insert assets after compatibility_date for project mode via key ordering
  const ordered =
    mode === 'project'
      ? (() => {
          const { $schema, name, main, compatibility_date, assets, ...rest } =
            withAssets as typeof withAssets & { assets: object };
          return { $schema, name, main, compatibility_date, assets, ...rest };
        })()
      : withAssets;

  writeFileSync(configPath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8');
}

/** Apply all placeholder patches in a single read-write cycle */
export function patchWranglerConfigBatch(
  projectRoot: string,
  patches: { occurrence: number; newId: string }[]
): void {
  const configPath = resolve(projectRoot, 'wrangler.jsonc');
  let content = readFileSync(configPath, 'utf-8');

  // Sort by occurrence descending so earlier replacements don't shift later indices
  const sorted = [...patches].sort((a, b) => b.occurrence - a.occurrence);

  for (const { occurrence, newId } of sorted) {
    let idx = -1;
    for (let i = 0; i <= occurrence; i++) {
      idx = content.indexOf(PLACEHOLDER, idx + 1);
      if (idx === -1) break;
    }
    if (idx === -1) continue; // Already patched
    content = content.substring(0, idx) + newId + content.substring(idx + PLACEHOLDER.length);
  }

  writeFileSync(configPath, content, 'utf-8');
}

export function isAlreadyPatched(projectRoot: string): boolean {
  const content = readFileSync(resolve(projectRoot, 'wrangler.jsonc'), 'utf-8');
  return !content.includes(PLACEHOLDER);
}

/**
 * Replace real resource IDs in wrangler.jsonc back with the placeholder string.
 * Returns true if a reset was performed, false if config was already at placeholder state.
 * Safe to call unconditionally — reads the file once and only writes if needed.
 */
export function resetWranglerConfig(projectRoot: string): boolean {
  const configPath = resolve(projectRoot, 'wrangler.jsonc');
  let content = readFileSync(configPath, 'utf-8');

  if (content.includes(PLACEHOLDER)) return false;

  content = content.replace(
    /("database_id"\s*:\s*")[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(")/g,
    `$1${PLACEHOLDER}$2`
  );
  content = content.replace(/("id"\s*:\s*")[0-9a-f]{32}(")/g, `$1${PLACEHOLDER}$2`);

  writeFileSync(configPath, content, 'utf-8');
  return true;
}
