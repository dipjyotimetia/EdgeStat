export const RESOURCE_NAMES = {
  d1Database: 'edgestat-db',
  kvNamespace: 'KV',
  r2Bucket: 'edgestat-archives',
  queues: ['edgestat-events', 'edgestat-events-dlq'] as const,
  secretName: 'MASTER_KEY',
} as const;
