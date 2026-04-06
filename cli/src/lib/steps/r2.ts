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

    // R2 requires opt-in via the Cloudflare dashboard before first use
    if (errorContains(e, 'enable r2') || errorContains(e, '10042')) {
      throw new Error(
        'R2 is not enabled on your account.\n' +
        'Enable it at: https://dash.cloudflare.com/?to=/:account/r2',
      );
    }

    throw e;
  }
}
