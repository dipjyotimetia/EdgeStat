# CLI Auto-Generate wrangler.jsonc — Design Spec

**Date:** 2026-04-06
**Status:** Approved

---

## Problem

The CLI setup command (`edgestat setup`) requires a `wrangler.jsonc` to exist before it can run. `findProjectRoot()` walks up from the CLI's own file location and throws if none is found. This blocks two valid use cases:

- **Project mode:** developer cloned the repo but has no `wrangler.jsonc` (gitignored or wiped)
- **Standalone mode:** user installed the CLI globally and is running from a fresh empty directory with no worker source at all

---

## Architecture

A new `scaffold` step is inserted between `checkPrerequisites` and resource provisioning in `setup.ts`. It resolves the project root and detects the context so later steps can adapt.

```
setup()
  ├── checkPrerequisites()       [existing]
  ├── scaffold()                 [NEW — first step]
  │   ├── wrangler.jsonc found in walk-up? → mode: 'existing', return that dir
  │   ├── src/index.ts in CWD?             → mode: 'project',  generate config in CWD
  │   └── else                             → mode: 'standalone', download release + generate config
  ├── createD1 / KV / R2 / queues()        [existing]
  ├── setMasterKey()                        [existing]
  ├── runMigrations()                       [existing]
  ├── buildProject()                        [skipped when mode === 'standalone']
  └── deployWorker()                        [existing]
```

`projectRoot` is no longer derived inside `setup.ts` via `findProjectRoot()` — it comes from the scaffold result. The `--update-config` / `patchWranglerConfigBatch` patching flow is unchanged.

---

## Components

### `cli/src/lib/steps/scaffold.ts` (new)

```ts
export type ScaffoldMode = 'existing' | 'project' | 'standalone';

export interface ScaffoldResult {
  mode: ScaffoldMode;
  projectRoot: string;
}

export async function scaffold(cwd: string, dryRun: boolean): Promise<ScaffoldResult>;
```

**Three branches:**

1. **`'existing'`** — `wrangler.jsonc` found in walk-up from `cwd`. Return that directory, do nothing.

2. **`'project'`** — no config, but `src/index.ts` exists in `cwd`. Call `generateWranglerConfig(cwd, 'project')`. Return `cwd`.

3. **`'standalone'`** — no config, no source. Call `downloadRelease(cwd)` then `generateWranglerConfig(cwd, 'standalone')`. Return `cwd`.

In dry-run mode: skip download and config write, log what would happen, return `{ mode, projectRoot: cwd }`.

### `downloadRelease(cwd)` (within `scaffold.ts`)

- Calls `https://api.github.com/repos/dipjyotimetia/EdgeStat/releases/latest` via Node `fetch`
- Finds the asset named `edgestat-release.tar.gz` in the release assets list
- Downloads and extracts it into `cwd`
- Expected archive contents: `worker.js` + `migrations/` folder with SQL files
- On failure: throws with a user-readable message before any files are written (no partial state)

### `cli/src/lib/config.ts` changes

**`findProjectRoot(startDir?: string): string | null`**

- `startDir` defaults to `process.cwd()` (previously defaulted to the CLI's own `__dirname`)
- Returns the directory where `wrangler.jsonc` was found, or `null` if not found (no throw)

**`generateWranglerConfig(dir: string, mode: 'project' | 'standalone'): void`**

- Writes `wrangler.jsonc` into `dir`
- Sets `compatibility_date` to today's date at generation time
- Uses `local-dev-placeholder` for all resource IDs so `--update-config` / `patchWranglerConfigBatch` works unchanged
- Skips write silently if `wrangler.jsonc` already exists (race condition guard)

**Template differences by mode:**

| Field            | `'project'`                   | `'standalone'` |
| ---------------- | ----------------------------- | -------------- |
| `main`           | `"src/index.ts"`              | `"worker.js"`  |
| `assets` block   | included (`./dashboard/dist`) | omitted        |
| `migrations_dir` | `"src/migrations"`            | `"migrations"` |

Both modes include: `d1_databases`, `kv_namespaces`, `r2_buckets`, `queues`, `triggers`, `vars`.

### `cli/src/lib/steps/build.ts` changes

Accepts `mode` parameter; skips `npm run build` when `mode === 'standalone'` (the downloaded `worker.js` is deployed directly by wrangler, no compilation needed).

```ts
export async function buildProject(
  projectRoot: string,
  dryRun: boolean,
  mode: ScaffoldMode
): Promise<StepResult>;
```

### `cli/src/lib/constants.ts` additions

```ts
github: {
  owner: 'dipjyotimetia',
  repo: 'EdgeStat',
  releaseAsset: 'edgestat-release.tar.gz',
} as const
```

### `cli/src/commands/setup.ts` changes

- `cwd = process.cwd()` passed to scaffold
- `projectRoot` and `mode` sourced from scaffold result
- Build step receives `mode`

---

## Error Handling

| Scenario                              | Behaviour                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GitHub API unreachable                | Throw: `"Could not fetch latest release. Check your internet connection or visit github.com/dipjyotimetia/EdgeStat/releases"` |
| Asset not found in release            | Throw with release tag so user can investigate                                                                                |
| Tar extraction failure                | Throw, CWD left clean                                                                                                         |
| `wrangler.jsonc` exists at write time | Skip silently                                                                                                                 |
| Dry-run                               | Log what would happen, no files written, no network calls                                                                     |

---

## Files Changed

| File                            | Change                                                 |
| ------------------------------- | ------------------------------------------------------ |
| `cli/src/lib/steps/scaffold.ts` | New                                                    |
| `cli/src/lib/config.ts`         | `findProjectRoot` signature + `generateWranglerConfig` |
| `cli/src/lib/steps/build.ts`    | Accept `mode`, skip build in standalone                |
| `cli/src/lib/constants.ts`      | Add `github` constant                                  |
| `cli/src/commands/setup.ts`     | Wire scaffold result through to steps                  |

---

## Out of Scope

- Updating an existing `wrangler.jsonc` (only generates when absent)
- Fetching a specific release version (always uses latest)
- Supporting multiple worker variants or custom asset directories
