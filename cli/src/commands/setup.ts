import {
  intro,
  outro,
  spinner,
  note,
  confirm,
  text,
  cancel,
  isCancel,
} from '@clack/prompts';
import { brand, log } from '../lib/colors.js';
import { findProjectRoot, patchWranglerConfigBatch, isAlreadyPatched } from '../lib/config.js';
import { RESOURCE_NAMES } from '../lib/constants.js';
import { checkPrerequisites } from '../lib/steps/prerequisites.js';
import { createD1 } from '../lib/steps/d1.js';
import { createKV } from '../lib/steps/kv.js';
import { createR2 } from '../lib/steps/r2.js';
import { createQueues } from '../lib/steps/queues.js';
import { setMasterKey, generateMasterKey } from '../lib/steps/secrets.js';
import { runMigrations } from '../lib/steps/migrations.js';
import { buildProject } from '../lib/steps/build.js';
import { deployWorker } from '../lib/steps/deploy.js';
import type { StepResult } from '../lib/types.js';

interface SetupOptions {
  skipDeploy?: boolean;
  dryRun?: boolean;
}

interface StepDef {
  name: string;
  label: string;
  manualCmd: string;
  run: () => Promise<StepResult>;
}

export async function setup(options: SetupOptions) {
  const dryRun = options.dryRun ?? false;
  const skipDeploy = options.skipDeploy ?? false;

  console.log();
  intro(`${brand.boldMist('edge')}${brand.boldTeal('stat')} ${brand.dim('· setup')}`);

  if (dryRun) {
    log.info('Dry run mode — no resources will be created');
    log.blank();
  }

  // ─── Prerequisites ──────────────────────────────────────────────────
  try {
    await checkPrerequisites(dryRun);
  } catch (e) {
    log.error((e as Error).message);
    cancel('Setup cannot continue');
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  let masterKey = '';
  let workerUrl = '';
  const completed: string[] = [];
  const s = spinner();

  // ─── Resource provisioning ──────────────────────────────────────────
  const steps: StepDef[] = [
    {
      name: 'd1', label: 'D1 database',
      manualCmd: `wrangler d1 create ${RESOURCE_NAMES.d1Database}`,
      run: () => createD1(projectRoot, dryRun),
    },
    {
      name: 'kv', label: 'KV namespace',
      manualCmd: `wrangler kv namespace create ${RESOURCE_NAMES.kvNamespace}`,
      run: () => createKV(projectRoot, dryRun),
    },
    {
      name: 'r2', label: 'R2 bucket',
      manualCmd: `wrangler r2 bucket create ${RESOURCE_NAMES.r2Bucket}`,
      run: () => createR2(projectRoot, dryRun),
    },
    {
      name: 'queues', label: 'Queues',
      manualCmd: `wrangler queues create ${RESOURCE_NAMES.queues[0]}`,
      run: () => createQueues(projectRoot, dryRun),
    },
  ];

  // wrangler.jsonc placeholder order — must match the file layout:
  //   occurrence 0 → d1_databases[0].database_id
  //   occurrence 1 → kv_namespaces[0].id
  const D1_PLACEHOLDER_OCCURRENCE = 0;
  const KV_PLACEHOLDER_OCCURRENCE = 1;

  const configPatches: Array<{ occurrence: number; newId: string }> = [];

  for (const step of steps) {
    s.start(`Creating ${step.label}...`);
    try {
      const result = await step.run();
      const detail = result.id && result.id !== 'dry-run'
        ? ` ${brand.dim(`(${result.id.slice(0, 12)}...)`)}`
        : '';

      if (result.status === 'created') {
        s.stop(`${brand.teal('✓')} ${step.label} created${detail}`);
      } else {
        s.stop(`${brand.teal('✓')} ${step.label} ${brand.dim('(already exists)')}`);
      }

      // Collect IDs for batched config patch
      if (step.name === 'd1' && result.id && result.id !== 'dry-run') {
        configPatches.push({ occurrence: D1_PLACEHOLDER_OCCURRENCE, newId: result.id });
      }
      if (step.name === 'kv' && result.id && result.id !== 'dry-run') {
        configPatches.push({ occurrence: KV_PLACEHOLDER_OCCURRENCE, newId: result.id });
      }

      completed.push(step.name);
    } catch (e) {
      s.stop(`${brand.red('✗')} ${step.label} failed`);
      log.error((e as Error).message);
      printRecovery(completed, steps);
      process.exit(1);
    }
  }

  // Batch-patch wrangler.jsonc with all collected IDs
  if (configPatches.length > 0 && !isAlreadyPatched(projectRoot)) {
    patchWranglerConfigBatch(projectRoot, configPatches);
    log.success('wrangler.jsonc updated with resource IDs');
  }

  // ─── MASTER_KEY ─────────────────────────────────────────────────────
  log.blank();
  const autoGenerate = await confirm({
    message: 'Auto-generate a secure MASTER_KEY?',
    initialValue: true,
  });

  if (isCancel(autoGenerate)) {
    cancel('Setup cancelled');
    process.exit(0);
  }

  if (autoGenerate) {
    masterKey = generateMasterKey();
  } else {
    const input = await text({
      message: 'Enter your MASTER_KEY:',
      placeholder: 'minimum 32 characters',
      validate: (v) => (!v || v.length < 32 ? 'Key must be at least 32 characters' : undefined),
    });
    if (isCancel(input)) {
      cancel('Setup cancelled');
      process.exit(0);
    }
    masterKey = input;
  }

  s.start('Setting MASTER_KEY secret...');
  try {
    await setMasterKey(projectRoot, masterKey, dryRun);
    s.stop(`${brand.teal('✓')} MASTER_KEY secret set`);
    completed.push('secret');
  } catch (e) {
    s.stop(`${brand.red('✗')} MASTER_KEY failed`);
    log.error((e as Error).message);
    printRecovery(completed, steps);
    process.exit(1);
  }

  // ─── Migrations ─────────────────────────────────────────────────────
  s.start('Running D1 migrations...');
  try {
    await runMigrations(projectRoot, dryRun);
    s.stop(`${brand.teal('✓')} D1 migrations applied`);
    completed.push('migrations');
  } catch (e) {
    s.stop(`${brand.red('✗')} Migrations failed`);
    log.error((e as Error).message);
    printRecovery(completed, steps);
    process.exit(1);
  }

  // ─── Build + Deploy ─────────────────────────────────────────────────
  if (!skipDeploy) {
    s.start('Building project...');
    try {
      await buildProject(projectRoot, dryRun);
      s.stop(`${brand.teal('✓')} Project built`);
      completed.push('build');
    } catch (e) {
      s.stop(`${brand.red('✗')} Build failed`);
      log.error((e as Error).message);
      printRecovery(completed, steps);
      process.exit(1);
    }

    s.start('Deploying to Cloudflare...');
    try {
      const result = await deployWorker(projectRoot, dryRun);
      workerUrl = result.url ?? 'unknown';
      s.stop(`${brand.teal('✓')} Deployed to ${brand.mint(workerUrl)}`);
      completed.push('deploy');
    } catch (e) {
      s.stop(`${brand.red('✗')} Deploy failed`);
      log.error((e as Error).message);
      printRecovery(completed, steps);
      process.exit(1);
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────
  log.blank();

  const lines = [];
  if (workerUrl && !skipDeploy) {
    lines.push(`${brand.dim('URL')}          ${brand.mint(workerUrl)}`);
  }
  lines.push(`${brand.dim('MASTER_KEY')}   ${brand.mint(masterKey)}`);
  lines.push('');
  lines.push(`${brand.red('!')} Save your MASTER_KEY — it cannot be retrieved later.`);
  lines.push('');
  lines.push(brand.dim('Next steps:'));
  if (workerUrl && !skipDeploy) {
    lines.push(`  1. Open ${brand.mint(workerUrl)}`);
    lines.push('  2. Enter your MASTER_KEY');
    lines.push('  3. Create your first site');
    lines.push('  4. Add the tracking snippet');
  } else {
    lines.push('  1. Run: npm run build');
    lines.push('  2. Run: wrangler deploy');
    lines.push('  3. Visit your Worker URL and enter MASTER_KEY');
  }

  note(lines.join('\n'), brand.teal('EdgeStat deployed'));
  outro(brand.teal('Analytics at the edge. Owned by you.'));
}

function printRecovery(completed: string[], allSteps: StepDef[]) {
  log.blank();
  log.info('Completed:');
  for (const name of completed) log.success(name);
  log.blank();
  log.info('Remaining (run manually):');
  for (const step of allSteps) {
    if (!completed.includes(step.name)) log.cmd(step.manualCmd);
  }
  log.blank();
}
