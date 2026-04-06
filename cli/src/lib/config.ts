import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = 'local-dev-placeholder';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function findProjectRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== resolve(dir, '..')) {
    if (existsSync(resolve(dir, 'wrangler.jsonc'))) return dir;
    dir = resolve(dir, '..');
  }
  throw new Error('Could not find project root (no wrangler.jsonc found)');
}

/** Apply all placeholder patches in a single read-write cycle */
export function patchWranglerConfigBatch(
  projectRoot: string,
  patches: Array<{ occurrence: number; newId: string }>,
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
    `$1${PLACEHOLDER}$2`,
  );
  content = content.replace(
    /("id"\s*:\s*")[0-9a-f]{32}(")/g,
    `$1${PLACEHOLDER}$2`,
  );

  writeFileSync(configPath, content, 'utf-8');
  return true;
}
