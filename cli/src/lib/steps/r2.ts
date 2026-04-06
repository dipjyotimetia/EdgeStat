import { exec, errorContains } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

export async function createR2(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };

  try {
    exec(`wrangler r2 bucket create ${RESOURCE_NAMES.r2Bucket}`, { cwd: projectRoot });
    return { status: 'created' };
  } catch (e) {
    if (errorContains(e, 'already exists')) return { status: 'skipped' };
    throw e;
  }
}
