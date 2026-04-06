# CLI Auto-Generate wrangler.jsonc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `scaffold` step to `edgestat setup` that auto-generates `wrangler.jsonc` when none exists — either from local source or by downloading the latest GitHub release.

**Architecture:** A new `scaffold.ts` step runs before resource provisioning, detects whether config exists / source is present / standalone, and generates `wrangler.jsonc` accordingly. `config.ts` gains `generateWranglerConfig()` and `findProjectRoot()` is updated to return `string | null` instead of throwing. All downstream callers are updated to handle the nullable return.

**Tech Stack:** TypeScript, Node.js 24 (built-in `fetch`), system `tar` command, `@clack/prompts`, `wrangler` CLI.

---

## File Map

| File                            | Action | Responsibility                                                           |
| ------------------------------- | ------ | ------------------------------------------------------------------------ |
| `cli/src/lib/constants.ts`      | Modify | Add `github` release constant                                            |
| `cli/src/lib/config.ts`         | Modify | `findProjectRoot` returns `string \| null`; add `generateWranglerConfig` |
| `cli/src/lib/steps/scaffold.ts` | Create | Detect context, download release, generate config                        |
| `cli/src/lib/steps/build.ts`    | Modify | Accept `ScaffoldMode`, skip build in standalone                          |
| `cli/src/commands/setup.ts`     | Modify | Source `projectRoot` + `mode` from scaffold result                       |
| `cli/src/commands/cleanup.ts`   | Modify | Handle `findProjectRoot` returning `null`                                |

---

### Task 1: Add `github` constant to `constants.ts`

**Files:**

- Modify: `cli/src/lib/constants.ts`

- [ ] **Step 1: Add the github block**

Open `cli/src/lib/constants.ts` and add after the existing exports:

```ts
export const RESOURCE_NAMES = {
  workerName: 'edgestat',
  d1Database: 'edgestat-db',
  kvNamespace: 'KV',
  r2Bucket: 'edgestat-archives',
  queues: ['edgestat-events', 'edgestat-events-dlq'] as const,
  secretName: 'MASTER_KEY',
} as const;

/** Binding names as declared in wrangler.jsonc */
export const BINDINGS = {
  db: 'DB',
  kv: 'KV',
  r2: 'R2',
  queue: 'EVENTS_QUEUE',
} as const;

export const GITHUB = {
  owner: 'dipjyotimetia',
  repo: 'EdgeStat',
  releaseAsset: 'edgestat-release.tar.gz',
} as const;
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd cli && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add cli/src/lib/constants.ts
git commit -m "feat(cli): add GITHUB constant for release download"
```

---

### Task 2: Update `config.ts` — nullable `findProjectRoot` + `generateWranglerConfig`

**Files:**

- Modify: `cli/src/lib/config.ts`

- [ ] **Step 1: Replace the entire file content**

```ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const PLACEHOLDER = 'local-dev-placeholder';

/**
 * Walk up from startDir looking for wrangler.jsonc.
 * Returns the directory that contains it, or null if not found.
 * Defaults to process.cwd() so callers outside the repo work correctly.
 */
export function findProjectRoot(startDir?: string): string | null {
  let dir = resolve(startDir ?? process.cwd());
  const root = resolve(dir, '/');
  while (dir !== root) {
    if (existsSync(resolve(dir, 'wrangler.jsonc'))) return dir;
    dir = resolve(dir, '..');
  }
  return null;
}

export type WranglerConfigMode = 'project' | 'standalone';

/**
 * Write a wrangler.jsonc with placeholder IDs into dir.
 * Skips silently if the file already exists (race-condition guard).
 */
export function generateWranglerConfig(dir: string, mode: WranglerConfigMode): void {
  const configPath = resolve(dir, 'wrangler.jsonc');
  if (existsSync(configPath)) return;

  const today = new Date().toISOString().slice(0, 10);

  const base = {
    $schema: 'node_modules/wrangler/config-schema.json',
    name: 'edgestat',
    main: mode === 'project' ? 'src/index.ts' : 'worker.js',
    compatibility_date: today,
    d1_databases: [
      {
        binding: 'DB',
        database_name: 'edgestat-db',
        database_id: PLACEHOLDER,
        migrations_dir: mode === 'project' ? 'src/migrations' : 'migrations',
      },
    ],
    kv_namespaces: [{ binding: 'KV', id: PLACEHOLDER }],
    r2_buckets: [{ binding: 'R2', bucket_name: 'edgestat-archives' }],
    queues: {
      producers: [{ binding: 'EVENTS_QUEUE', queue: 'edgestat-events' }],
      consumers: [
        {
          queue: 'edgestat-events',
          max_batch_size: 100,
          max_batch_timeout: 60,
          max_retries: 3,
          dead_letter_queue: 'edgestat-events-dlq',
        },
      ],
    },
    triggers: { crons: ['0 0 * * *', '30 0 * * *', '0 */6 * * *'] },
    vars: { RETENTION_DAYS: '30', SESSION_TIMEOUT_MINUTES: '30' },
  };

  const withAssets =
    mode === 'project'
      ? {
          ...base,
          assets: {
            directory: './dashboard/dist',
            binding: 'ASSETS',
            not_found_handling: 'single-page-application',
            html_handling: 'auto-trailing-slash',
            run_worker_first: ['/v1/*', '/api/*', '/sse/*', '/s.js'],
          },
        }
      : base;

  // Insert assets after main for project mode — JSON.stringify key order follows insertion
  const ordered =
    mode === 'project'
      ? (() => {
          const { $schema, name, main, compatibility_date, assets, ...rest } =
            withAssets as typeof withAssets & { assets: object };
          return { $schema, name, main, compatibility_date, assets, ...rest };
        })()
      : withAssets;

  writeFileSync(configPath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8');
}

/** Apply all placeholder patches in a single read-write cycle */
export function patchWranglerConfigBatch(
  projectRoot: string,
  patches: { occurrence: number; newId: string }[]
): void {
  const configPath = resolve(projectRoot, 'wrangler.jsonc');
  let content = readFileSync(configPath, 'utf-8');

  const sorted = [...patches].sort((a, b) => b.occurrence - a.occurrence);

  for (const { occurrence, newId } of sorted) {
    let idx = -1;
    for (let i = 0; i <= occurrence; i++) {
      idx = content.indexOf(PLACEHOLDER, idx + 1);
      if (idx === -1) break;
    }
    if (idx === -1) continue;
    content = content.substring(0, idx) + newId + content.substring(idx + PLACEHOLDER.length);
  }

  writeFileSync(configPath, content, 'utf-8');
}

export function isAlreadyPatched(projectRoot: string): boolean {
  const content = readFileSync(resolve(projectRoot, 'wrangler.jsonc'), 'utf-8');
  return !content.includes(PLACEHOLDER);
}

/**
 * Replace real resource IDs in wrangler.jsonc back with the placeholder string.
 * Returns true if a reset was performed, false if config was already at placeholder state.
 */
export function resetWranglerConfig(projectRoot: string): boolean {
  const configPath = resolve(projectRoot, 'wrangler.jsonc');
  let content = readFileSync(configPath, 'utf-8');

  if (content.includes(PLACEHOLDER)) return false;

  content = content.replace(
    /("database_id"\s*:\s*")[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(")/g,
    `$1${PLACEHOLDER}$2`
  );
  content = content.replace(/("id"\s*:\s*")[0-9a-f]{32}(")/g, `$1${PLACEHOLDER}$2`);

  writeFileSync(configPath, content, 'utf-8');
  return true;
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd cli && npx tsc --noEmit
```

Expected: errors in `setup.ts` and `cleanup.ts` because `findProjectRoot()` now returns `string | null` — that's expected and will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add cli/src/lib/config.ts
git commit -m "feat(cli): update findProjectRoot to return null + add generateWranglerConfig"
```

---

### Task 3: Create `scaffold.ts`

**Files:**

- Create: `cli/src/lib/steps/scaffold.ts`

- [ ] **Step 1: Create the file**

```ts
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { exec } from '../exec.js';
import { findProjectRoot, generateWranglerConfig, type WranglerConfigMode } from '../config.js';
import { GITHUB } from '../constants.js';

export type ScaffoldMode = 'existing' | WranglerConfigMode;

export interface ScaffoldResult {
  mode: ScaffoldMode;
  projectRoot: string;
}

/**
 * Detect context and ensure wrangler.jsonc exists in the project root.
 *
 * 'existing'   — wrangler.jsonc found in walk-up, nothing written
 * 'project'    — no config but src/index.ts present, config generated in CWD
 * 'standalone' — no config, no source; release downloaded + config generated in CWD
 */
export async function scaffold(cwd: string, dryRun: boolean): Promise<ScaffoldResult> {
  const existing = findProjectRoot(cwd);
  if (existing) return { mode: 'existing', projectRoot: existing };

  const isProject = existsSync(resolve(cwd, 'src', 'index.ts'));
  const mode: WranglerConfigMode = isProject ? 'project' : 'standalone';

  if (dryRun) {
    console.log(
      `[dry-run] Would generate wrangler.jsonc (${mode} mode)${
        mode === 'standalone' ? ' after downloading latest GitHub release' : ''
      }`
    );
    return { mode, projectRoot: cwd };
  }

  if (mode === 'standalone') {
    await downloadRelease(cwd);
  }

  generateWranglerConfig(cwd, mode);
  return { mode, projectRoot: cwd };
}

interface GithubAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

async function downloadRelease(cwd: string): Promise<void> {
  const apiUrl = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/releases/latest`;

  let release: GithubRelease;
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    release = (await res.json()) as GithubRelease;
  } catch (e) {
    throw new Error(
      `Could not fetch latest release. Check your internet connection or visit ` +
        `github.com/${GITHUB.owner}/${GITHUB.repo}/releases\n${(e as Error).message}`
    );
  }

  const asset = release.assets.find((a) => a.name === GITHUB.releaseAsset);
  if (!asset) {
    throw new Error(
      `Release ${release.tag_name} does not contain expected asset "${GITHUB.releaseAsset}". ` +
        `Visit github.com/${GITHUB.owner}/${GITHUB.repo}/releases/${release.tag_name} to investigate.`
    );
  }

  const tarPath = resolve(tmpdir(), `edgestat-release-${Date.now()}.tar.gz`);
  try {
    const res = await fetch(asset.browser_download_url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    writeFileSync(tarPath, Buffer.from(buf));
    exec(`tar -xzf ${tarPath} -C ${cwd}`);
  } finally {
    try {
      unlinkSync(tarPath);
    } catch {
      // best-effort cleanup
    }
  }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd cli && npx tsc --noEmit
```

Expected: no new errors from `scaffold.ts`. Existing errors from `setup.ts` / `cleanup.ts` remain.

- [ ] **Step 3: Commit**

```bash
git add cli/src/lib/steps/scaffold.ts
git commit -m "feat(cli): add scaffold step with wrangler.jsonc generation and release download"
```

---

### Task 4: Update `build.ts` to accept `ScaffoldMode`

**Files:**

- Modify: `cli/src/lib/steps/build.ts`

- [ ] **Step 1: Replace the file content**

```ts
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
```

- [ ] **Step 2: Verify typecheck passes**

```bash
cd cli && npx tsc --noEmit
```

Expected: error in `setup.ts` about wrong number of arguments to `buildProject` — that's expected.

- [ ] **Step 3: Commit**

```bash
git add cli/src/lib/steps/build.ts
git commit -m "feat(cli): skip build step in standalone scaffold mode"
```

---

### Task 5: Update `setup.ts` to wire scaffold result

**Files:**

- Modify: `cli/src/commands/setup.ts`

- [ ] **Step 1: Add `scaffold` import and replace `findProjectRoot` call**

At the top of `setup.ts`, add the scaffold import alongside the existing imports:

```ts
import { scaffold } from '../lib/steps/scaffold.js';
```

Remove the existing import of `findProjectRoot` from `'../lib/config.js'`. The updated imports block should be:

```ts
import { intro, outro, spinner, note, confirm, text, cancel, isCancel } from '@clack/prompts';
import { brand, log } from '../lib/colors.js';
import { patchWranglerConfigBatch, isAlreadyPatched } from '../lib/config.js';
import { RESOURCE_NAMES } from '../lib/constants.js';
import { checkPrerequisites } from '../lib/steps/prerequisites.js';
import { scaffold } from '../lib/steps/scaffold.js';
import { createD1 } from '../lib/steps/d1.js';
import { createKV } from '../lib/steps/kv.js';
import { createR2 } from '../lib/steps/r2.js';
import { createQueues } from '../lib/steps/queues.js';
import { setMasterKey, generateMasterKey } from '../lib/steps/secrets.js';
import { runMigrations } from '../lib/steps/migrations.js';
import { buildProject } from '../lib/steps/build.js';
import { deployWorker } from '../lib/steps/deploy.js';
import { createFirstSite, defaultSiteName, type FirstSiteResult } from '../lib/steps/site.js';
import type { StepResult } from '../lib/types.js';
```

- [ ] **Step 2: Replace `findProjectRoot()` call with scaffold step**

In the `setup()` function body, replace:

```ts
const projectRoot = findProjectRoot();
```

with:

```ts
s.start('Checking project setup...');
const { mode, projectRoot } = await scaffold(process.cwd(), dryRun);
if (mode === 'existing') {
  s.stop(`${brand.teal('✓')} Project root found`);
} else if (mode === 'project') {
  s.stop(`${brand.teal('✓')} wrangler.jsonc generated (project mode)`);
} else {
  s.stop(`${brand.teal('✓')} Release downloaded and wrangler.jsonc generated`);
}
```

Place this block immediately after the `checkPrerequisites` try/catch block (before the `steps` array). Note: `s` (the spinner) is declared just before the steps array in the original — move the `const s = spinner();` line to above the scaffold call.

- [ ] **Step 3: Pass `mode` to `buildProject`**

`buildProject` is called directly in the `if (!skipDeploy)` block (not in the `steps` array). Find:

```ts
await buildProject(projectRoot, dryRun);
```

Replace with:

```ts
await buildProject(projectRoot, dryRun, mode);
```

- [ ] **Step 4: Verify typecheck passes**

```bash
cd cli && npx tsc --noEmit
```

Expected: only `cleanup.ts` errors remain.

- [ ] **Step 5: Commit**

```bash
git add cli/src/commands/setup.ts
git commit -m "feat(cli): wire scaffold step into setup command"
```

---

### Task 6: Update `cleanup.ts` to handle nullable `findProjectRoot`

**Files:**

- Modify: `cli/src/commands/cleanup.ts`

- [ ] **Step 1: Update the `findProjectRoot` call**

In `cleanup.ts`, find line 72:

```ts
const projectRoot = findProjectRoot();
```

Replace with:

```ts
const projectRoot = findProjectRoot(process.cwd());
if (!projectRoot) {
  log.error('No wrangler.jsonc found — nothing to clean up. Run edgestat setup first.');
  process.exit(1);
}
```

- [ ] **Step 2: Verify typecheck is clean**

```bash
cd cli && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build the CLI**

```bash
cd cli && npm run build
```

Expected: `cli/dist/` produced with no TypeScript errors.

- [ ] **Step 4: Smoke-test dry-run from a temp directory**

```bash
mkdir /tmp/edgestat-test && cd /tmp/edgestat-test
node /path/to/analytics-engine/cli/dist/index.js setup --dry-run
```

Expected output includes:

- `✓ Wrangler X.X.X detected`
- `[dry-run] Would generate wrangler.jsonc (standalone mode) after downloading latest GitHub release`
- All subsequent steps show `(dry run)`

- [ ] **Step 5: Smoke-test dry-run from inside the project**

```bash
cd /path/to/analytics-engine
node cli/dist/index.js setup --dry-run
```

Expected: setup runs normally (mode: existing), no config generation message.

- [ ] **Step 6: Commit**

```bash
git add cli/src/commands/cleanup.ts
git commit -m "fix(cli): handle null findProjectRoot in cleanup command"
```

---

### Task 7: Build final CLI and verify

**Files:** none — verification only

- [ ] **Step 1: Full typecheck across workspace**

```bash
cd /path/to/analytics-engine && npm run typecheck
```

Expected: no errors.

- [ ] **Step 2: Build CLI**

```bash
npm run build --workspace cli
```

Expected: exits 0, `cli/dist/` updated.

- [ ] **Step 3: Commit**

```bash
git add cli/dist
git commit -m "chore(cli): rebuild dist after scaffold feature"
```
