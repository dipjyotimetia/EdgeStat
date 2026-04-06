import { randomBytes } from 'node:crypto';
import { exec } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

export function generateMasterKey(): string {
  return randomBytes(32).toString('base64url');
}

export async function setMasterKey(
  projectRoot: string,
  masterKey: string,
  dryRun: boolean,
): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };

  exec(`wrangler secret put ${RESOURCE_NAMES.secretName}`, {
    cwd: projectRoot,
    input: masterKey,
  });
  return { status: 'created' };
}
