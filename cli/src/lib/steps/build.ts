import { exec } from '../exec.js';
import type { ScaffoldMode } from './scaffold.js';
import type { StepResult } from '../types.js';

export async function buildProject(
  projectRoot: string,
  dryRun: boolean,
  mode: ScaffoldMode
): Promise<StepResult> {
  if (dryRun) return { status: 'skipped' };
  if (mode === 'standalone') return { status: 'skipped' };

  exec('npm run build', { cwd: projectRoot });
  return { status: 'created' };
}
