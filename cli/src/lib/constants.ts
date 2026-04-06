export const RESOURCE_NAMES = {
  d1Database: 'edgestat-db',
  kvNamespace: 'KV',
  r2Bucket: 'edgestat-archives',
  queues: ['edgestat-events', 'edgestat-events-dlq'] as const,
  secretName: 'MASTER_KEY',
} as const;

/** Binding names as declared in wrangler.jsonc */
export const BINDINGS = {
  db: 'DB',
  kv: 'KV',
  r2: 'R2',
  queue: 'EVENTS_QUEUE',
} as const;
