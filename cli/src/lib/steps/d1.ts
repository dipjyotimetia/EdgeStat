import { exec, errorContains, extractUuidFromError, safeJsonParse } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

const DB_NAME = RESOURCE_NAMES.d1Database;

export async function createD1(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped', id: 'dry-run' };

  try {
    const output = exec(`wrangler d1 create ${DB_NAME}`, { cwd: projectRoot });
    let dbId: string | undefined;
    try {
      dbId = safeJsonParse<{ uuid: string }>(output).uuid;
    } catch {
      const match = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
      dbId = match?.[1];
    }
    if (!dbId) throw new Error('Could not parse D1 database ID');
    return { status: 'created', id: dbId };
  } catch (e) {
    if (errorContains(e, 'already exists')) {
      // Try to extract ID from error message first
      const idFromError = extractUuidFromError(e);
      if (idFromError) return { status: 'skipped', id: idFromError };

      // Fallback: list databases
      const listOutput = exec('wrangler d1 list --json', { cwd: projectRoot });
      const databases = safeJsonParse<Array<{ uuid: string; name: string }>>(listOutput);
      const db = databases.find((d) => d.name === DB_NAME);
      if (db) return { status: 'skipped', id: db.uuid };
    }
    throw e;
  }
}
