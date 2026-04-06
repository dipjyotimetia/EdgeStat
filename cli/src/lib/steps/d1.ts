import { exec, errorContains, extractUuidFromError, safeJsonParse } from '../exec.js';
import { RESOURCE_NAMES, BINDINGS } from '../constants.js';
import type { StepResult } from '../types.js';

const DB_NAME = RESOURCE_NAMES.d1Database;

export function lookupD1(dbName: string, cwd: string): string | undefined {
  try {
    const out = exec('wrangler d1 list --json', { cwd });
    const databases = safeJsonParse<{ uuid: string; name: string }[]>(out);
    return databases.find((d) => d.name === dbName)?.uuid;
  } catch {
    return undefined;
  }
}

export async function createD1(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped', id: 'dry-run' };

  try {
    // --update-config patches wrangler.jsonc automatically on success (wrangler v4)
    const output = exec(`wrangler d1 create ${DB_NAME} --update-config --binding ${BINDINGS.db}`, {
      cwd: projectRoot,
    });
    let dbId: string | undefined;

    // wrangler v4: { d1_databases: [{ database_id, database_name }] }
    // wrangler v3: { uuid, name }
    try {
      const parsed = safeJsonParse<{ d1_databases?: { database_id: string }[]; uuid?: string }>(
        output
      );
      dbId = parsed.d1_databases?.[0]?.database_id ?? parsed.uuid;
    } catch {
      const match = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
      dbId = match?.[1];
    }

    if (!dbId) throw new Error('Could not parse D1 database ID');
    return { status: 'created', id: dbId };
  } catch (e) {
    if (errorContains(e, 'already exists')) {
      // --update-config did not run (create failed) — caller must patch config manually
      const idFromError = extractUuidFromError(e);
      if (idFromError) return { status: 'skipped', id: idFromError };

      const id = lookupD1(DB_NAME, projectRoot);
      if (id) return { status: 'skipped', id };
    }
    throw e;
  }
}
