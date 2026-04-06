import { exec, errorContains, extractUuidFromError, safeJsonParse } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

const DB_NAME = RESOURCE_NAMES.d1Database;

export async function createD1(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped', id: 'dry-run' };

  try {
    const output = exec(`wrangler d1 create ${DB_NAME}`, { cwd: projectRoot });
    let dbId: string | undefined;

    // wrangler v4 outputs JSON: { d1_databases: [{ database_id, database_name }] }
    // wrangler v3 outputs JSON: { uuid, name }
    try {
      const parsed = safeJsonParse<{ d1_databases?: Array<{ database_id: string }>; uuid?: string }>(output);
      dbId = parsed.d1_databases?.[0]?.database_id ?? parsed.uuid;
    } catch {
      // Last-resort: extract any UUID from output text
      const match = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
      dbId = match?.[1];
    }

    if (!dbId) throw new Error('Could not parse D1 database ID');
    return { status: 'created', id: dbId };
  } catch (e) {
    if (errorContains(e, 'already exists')) {
      const idFromError = extractUuidFromError(e);
      if (idFromError) return { status: 'skipped', id: idFromError };

      const listOutput = exec('wrangler d1 list --json', { cwd: projectRoot });
      const databases = safeJsonParse<Array<{ uuid: string; name: string }>>(listOutput);
      const db = databases.find((d) => d.name === DB_NAME);
      if (db) return { status: 'skipped', id: db.uuid };
    }
    throw e;
  }
}
