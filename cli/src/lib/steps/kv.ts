import { exec, errorContains, safeJsonParse } from '../exec.js';
import { RESOURCE_NAMES } from '../constants.js';
import type { StepResult } from '../types.js';

const KV_NAME = RESOURCE_NAMES.kvNamespace;

export async function createKV(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped', id: 'dry-run' };

  try {
    const output = exec(`wrangler kv namespace create ${KV_NAME}`, { cwd: projectRoot });
    const match = output.match(/id\s*=\s*"([a-f0-9]+)"/);
    if (!match) throw new Error('Could not parse KV namespace ID');
    return { status: 'created', id: match[1] };
  } catch (e) {
    if (errorContains(e, 'already exists') || errorContains(e, 'namespace already')) {
      // Try to extract ID from error
      const idMatch = String(e).match(/([a-f0-9]{32})/);
      if (idMatch) return { status: 'skipped', id: idMatch[1] };

      // Fallback: list namespaces
      const listOutput = exec('wrangler kv namespace list', { cwd: projectRoot });
      const namespaces = safeJsonParse<Array<{ id: string; title: string }>>(listOutput);
      const ns = namespaces.find((n) => n.title.includes('edgestat') && n.title.includes(KV_NAME));
      if (ns) return { status: 'skipped', id: ns.id };
    }
    throw e;
  }
}
