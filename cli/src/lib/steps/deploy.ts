import { exec } from '../exec.js';
import type { DeployResult } from '../types.js';

export async function deployWorker(projectRoot: string, dryRun: boolean): Promise<DeployResult> {
  if (dryRun) return { status: 'skipped', url: 'https://edgestat.example.workers.dev' };

  const output = exec('wrangler deploy', { cwd: projectRoot });
  const urlMatch = output.match(/(https:\/\/[^\s]+\.workers\.dev)/);

  return { status: 'created', url: urlMatch?.[1] };
}
