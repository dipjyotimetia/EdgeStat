import { exec } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

export async function runMigrations(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };

  exec(`wrangler d1 migrations apply ${RESOURCE_NAMES.d1Database} --remote`, { cwd: projectRoot });
  return { status: 'created' };
}
