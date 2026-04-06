import { intro, outro, spinner, confirm, cancel, isCancel, note } from '@clack/prompts';
import { brand, log } from '../lib/colors.js';
import { findProjectRoot, resetWranglerConfig } from '../lib/config.js';
import { RESOURCE_NAMES, BINDINGS } from '../lib/constants.js';
import { exec, errorContains } from '../lib/exec.js';

interface CleanupOptions {
  force?: boolean;
  dryRun?: boolean;
}

interface DeleteStep {
  label: string;
  cmd: string;
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

  // ─── Delete steps ────────────────────────────────────────────────────
  // Secrets must be deleted before the Worker (wrangler requires Worker to exist).
  // Queues, D1, KV, R2 are independent — order doesn't matter.

  const steps: DeleteStep[] = [
    {
      label: `Secret ${RESOURCE_NAMES.secretName}`,
      cmd: `wrangler secret delete ${RESOURCE_NAMES.secretName}`,
    },
    {
      label: `Worker ${RESOURCE_NAMES.workerName}`,
      cmd: 'wrangler delete',
    },
    {
      label: `Queue ${RESOURCE_NAMES.queues[1]}`,
      cmd: `wrangler queues delete ${RESOURCE_NAMES.queues[1]}`,
    },
    {
      label: `Queue ${RESOURCE_NAMES.queues[0]}`,
      cmd: `wrangler queues delete ${RESOURCE_NAMES.queues[0]}`,
    },
    {
      label: `D1 database ${RESOURCE_NAMES.d1Database}`,
      cmd: `wrangler d1 delete ${RESOURCE_NAMES.d1Database} -y`,
    },
    {
      label: `KV namespace ${RESOURCE_NAMES.kvNamespace}`,
      cmd: `wrangler kv namespace delete --binding ${BINDINGS.kv} -y`,
    },
    {
      label: `R2 bucket ${RESOURCE_NAMES.r2Bucket}`,
      cmd: `wrangler r2 bucket delete ${RESOURCE_NAMES.r2Bucket}`,
    },
  ];

  let allOk = true;

  for (const step of steps) {
    s.start(`Deleting ${step.label}...`);
    if (dryRun) {
      s.stop(`${brand.dim('○')} ${step.label} ${brand.dim(`(dry run: ${step.cmd})`)}`);
      continue;
    }

    try {
      exec(step.cmd, { cwd: projectRoot });
      s.stop(`${brand.teal('✓')} ${step.label} deleted`);
    } catch (e) {
      // Silently skip resources that don't exist
      if (
        errorContains(e, 'not found') ||
        errorContains(e, 'does not exist') ||
        errorContains(e, '10007') || // Worker not found
        errorContains(e, '10006')
      ) {
        // Resource not found
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
