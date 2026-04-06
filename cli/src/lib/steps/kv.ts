import { exec, errorContains, safeJsonParse } from '../exec.js';
import { RESOURCE_NAMES, BINDINGS } from '../constants.js';
import type { StepResult } from '../types.js';

const KV_NAME = RESOURCE_NAMES.kvNamespace;

export async function createKV(projectRoot: string, dryRun: boolean): Promise<StepResult> {
  if (dryRun) return { status: 'skipped', id: 'dry-run' };

  try {
    // --update-config patches wrangler.jsonc automatically on success (wrangler v4)
    const output = exec(
      `wrangler kv namespace create ${KV_NAME} --update-config --binding ${BINDINGS.kv}`,
      { cwd: projectRoot }
    );
    let kvId: string | undefined;

    // wrangler v4: { kv_namespaces: [{ binding, id }] }
    try {
      const parsed = safeJsonParse<{ kv_namespaces: { id: string }[] }>(output);
      kvId = parsed.kv_namespaces?.[0]?.id;
    } catch {
      // wrangler v3 fallback: id = "abc123..."
      const match = output.match(/id\s*=\s*"([a-f0-9]+)"/);
      kvId = match?.[1];
    }

    if (!kvId) throw new Error('Could not parse KV namespace ID');
    return { status: 'created', id: kvId };
  } catch (e) {
    if (errorContains(e, 'already exists') || errorContains(e, 'namespace already')) {
      // --update-config did not run (create failed) — caller must patch config manually
      const idMatch = String(e).match(/([a-f0-9]{32})/);
      if (idMatch) return { status: 'skipped', id: idMatch[1] };

      // wrangler v4 title = "KV"; wrangler v3 title = "edgestat-KV"
      const listOutput = exec('wrangler kv namespace list', { cwd: projectRoot });
      const namespaces = safeJsonParse<{ id: string; title: string }[]>(listOutput);
      const ns = namespaces.find((n) => n.title === KV_NAME || n.title === `edgestat-${KV_NAME}`);
      if (ns) return { status: 'skipped', id: ns.id };
    }
    throw e;
  }
}
