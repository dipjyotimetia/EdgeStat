import { exec } from '../exec.js';
import type { StepResult } from '../types.js';

export async function buildProject(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };

  exec('npm run build', { cwd: projectRoot });
  return { status: 'created' };
}
