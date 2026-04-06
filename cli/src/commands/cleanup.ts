import { intro, outro, spinner, confirm, cancel, isCancel, note } from '@clack/prompts';
import { brand, log } from '../lib/colors.js';
import { findProjectRoot, resetWranglerConfig, patchWranglerConfigBatch } from '../lib/config.js';
import { RESOURCE_NAMES } from '../lib/constants.js';
import { exec, errorContains, ResourceNotFoundError } from '../lib/exec.js';
import { lookupD1 } from '../lib/steps/d1.js';
import { lookupKV } from '../lib/steps/kv.js';

interface CleanupOptions {
  force?: boolean;
  dryRun?: boolean;
}

interface DeleteStep {
  label: string;
  fn: () => void;
}

function isNotFound(e: unknown): boolean {
  // Exclude shell-level "command not found" — only match Cloudflare resource-not-found errors
  if (errorContains(e, 'command not found') || errorContains(e, 'No such file or directory')) {
    return false;
  }
  return (
    errorContains(e, 'not found') ||
    errorContains(e, 'does not exist') ||
    errorContains(e, '10007') || // Worker not found
    errorContains(e, '10006') // Resource not found
  );
}

export async function cleanup(options: CleanupOptions) {
  const force = options.force ?? false;
  const dryRun = options.dryRun ?? false;

  console.log();
  intro(`${brand.boldMist('edge')}${brand.boldTeal('stat')} ${brand.dim('· cleanup')}`);

  if (dryRun) {
    log.info('Dry run mode — no resources will be deleted');
    log.blank();
  }

  // ─── Confirmation ────────────────────────────────────────────────────
  const resources = [
    `Worker          ${brand.mint(RESOURCE_NAMES.workerName)}`,
    `Secret          ${brand.mint(RESOURCE_NAMES.secretName)}`,
    `Queue           ${brand.mint(RESOURCE_NAMES.queues[0])}`,
    `Queue (DLQ)     ${brand.mint(RESOURCE_NAMES.queues[1])}`,
    `D1 database     ${brand.mint(RESOURCE_NAMES.d1Database)}`,
    `KV namespace    ${brand.mint(RESOURCE_NAMES.kvNamespace)}`,
    `R2 bucket       ${brand.mint(RESOURCE_NAMES.r2Bucket)}`,
  ];

  note(
    resources.join('\n') + '\n\n' + brand.red('! This operation is irreversible.'),
    brand.red('Resources to be permanently deleted')
  );

  if (!force && !dryRun) {
    const confirmed = await confirm({
      message: 'Delete all EdgeStat resources from your Cloudflare account?',
      initialValue: false,
    });

    if (isCancel(confirmed) || !confirmed) {
      cancel('Cleanup cancelled');
      process.exit(0);
    }
  }

  const projectRoot = findProjectRoot();
  const s = spinner();

  // ─── Pre-flight: resolve real IDs before the step loop ───────────────
  // wrangler.jsonc may have placeholder IDs if setup was interrupted.
  // wrangler d1 delete reads database_id from the config, so we patch it upfront.
  const d1Id = !dryRun ? lookupD1(RESOURCE_NAMES.d1Database, projectRoot) : undefined;
  const kvId = !dryRun ? lookupKV(RESOURCE_NAMES.kvNamespace, projectRoot) : undefined;
  if (d1Id) patchWranglerConfigBatch(projectRoot, [{ occurrence: 0, newId: d1Id }]);

  // ─── Delete steps ────────────────────────────────────────────────────
  // Ordered to satisfy Cloudflare's dependency constraints:
  // consumer binding must be removed before the Worker can be deleted,
  // and the Worker must be gone before its queue/DLQ can be deleted.
  const steps: DeleteStep[] = [
    {
      label: `Secret ${RESOURCE_NAMES.secretName}`,
      fn: () => exec(`wrangler secret delete ${RESOURCE_NAMES.secretName}`, { cwd: projectRoot }),
    },
    {
      label: `Queue consumer binding (${RESOURCE_NAMES.queues[0]} ← ${RESOURCE_NAMES.workerName})`,
      fn: () =>
        exec(
          `wrangler queues consumer remove ${RESOURCE_NAMES.queues[0]} ${RESOURCE_NAMES.workerName}`,
          { cwd: projectRoot }
        ),
    },
    {
      label: `Worker ${RESOURCE_NAMES.workerName}`,
      fn: () => exec('wrangler delete', { cwd: projectRoot }),
    },
    {
      label: `Queue ${RESOURCE_NAMES.queues[1]}`,
      fn: () => exec(`wrangler queues delete ${RESOURCE_NAMES.queues[1]}`, { cwd: projectRoot }),
    },
    {
      label: `Queue ${RESOURCE_NAMES.queues[0]}`,
      fn: () => exec(`wrangler queues delete ${RESOURCE_NAMES.queues[0]}`, { cwd: projectRoot }),
    },
    {
      label: `D1 database ${RESOURCE_NAMES.d1Database}`,
      fn: () => {
        if (!d1Id) throw new ResourceNotFoundError('D1 database not found');
        exec(`wrangler d1 delete ${RESOURCE_NAMES.d1Database} -y`, { cwd: projectRoot });
      },
    },
    {
      label: `KV namespace ${RESOURCE_NAMES.kvNamespace}`,
      fn: () => {
        if (!kvId) throw new ResourceNotFoundError('KV namespace not found');
        exec(`wrangler kv namespace delete --namespace-id ${kvId}`, { cwd: projectRoot });
      },
    },
    {
      label: `R2 bucket ${RESOURCE_NAMES.r2Bucket}`,
      fn: () => exec(`wrangler r2 bucket delete ${RESOURCE_NAMES.r2Bucket}`, { cwd: projectRoot }),
    },
  ];

  let allOk = true;

  for (const step of steps) {
    s.start(`Deleting ${step.label}...`);
    if (dryRun) {
      s.stop(`${brand.dim('○')} ${step.label} ${brand.dim('(dry run)')}`);
      continue;
    }

    try {
      step.fn();
      s.stop(`${brand.teal('✓')} ${step.label} deleted`);
    } catch (e) {
      if (e instanceof ResourceNotFoundError || isNotFound(e)) {
        s.stop(`${brand.teal('✓')} ${step.label} ${brand.dim('(not found, skipped)')}`);
        continue;
      }

      // R2-specific: bucket not empty
      if (errorContains(e, 'not empty') || errorContains(e, 'bucket is not empty')) {
        allOk = false;
        s.stop(`${brand.red('✗')} ${step.label} failed — bucket is not empty`);
        log.error(
          `Empty the bucket first:\n  wrangler r2 object delete ${RESOURCE_NAMES.r2Bucket} --recursive`
        );
        continue;
      }

      // R2 not enabled on account — nothing to delete
      if (errorContains(e, 'enable r2') || errorContains(e, '10042')) {
        s.stop(`${brand.teal('✓')} ${step.label} ${brand.dim('(R2 not enabled, skipped)')}`);
        continue;
      }

      allOk = false;
      s.stop(`${brand.red('✗')} ${step.label} failed`);
      log.error((e as Error).message);
    }
  }

  // ─── Reset wrangler.jsonc ────────────────────────────────────────────
  if (!dryRun && resetWranglerConfig(projectRoot)) {
    log.success('wrangler.jsonc reset to placeholder state');
  }

  log.blank();

  if (allOk) {
    outro(brand.teal('Cleanup complete. Run npm run setup to provision again.'));
  } else {
    outro(brand.red('Cleanup finished with some failures — see above.'));
    process.exit(1);
  }
}
