import { exec, errorContains } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

export async function createQueues(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };

  let allSkipped = true;
  for (const name of RESOURCE_NAMES.queues) {
    try {
      exec(`wrangler queues create ${name}`, { cwd: projectRoot });
      allSkipped = false;
    } catch (e) {
      if (!errorContains(e, 'already exists') && !errorContains(e, 'already taken')) throw e;
    }
  }
  return { status: allSkipped ? 'skipped' : 'created' };
}
