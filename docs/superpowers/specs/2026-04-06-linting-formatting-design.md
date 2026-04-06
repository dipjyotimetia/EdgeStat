# Linting & Formatting Setup — Design Spec

**Date:** 2026-04-06
**Status:** Approved

## Overview

Add ESLint, Prettier, Husky, and lint-staged to the `edgestat` monorepo for consistent code quality and formatting enforcement across all workspaces: root Cloudflare Worker, `dashboard`, `sdk`, `cli`, and `packages/schemas`.

## Architecture

Single root-level ESLint flat config governs the entire monorepo. Prettier runs standalone (not as an ESLint plugin). Pre-commit hooks enforce both on staged files. Turbo orchestrates `lint` across workspaces.

## ESLint Configuration

**File:** `eslint.config.js` at repo root (ESLint v9 flat config format).

Three rule layers applied by glob:

1. **All TypeScript files** (`**/*.ts`, `**/*.tsx`):
   - `@eslint/js` recommended rules
   - `typescript-eslint` strict + stylistic (type-aware, using `tsconfig.base.json`)
   - `eslint-config-prettier` to disable formatting rules that conflict with Prettier

2. **Dashboard only** (`dashboard/src/**/*.{ts,tsx}`):
   - Adds `eslint-plugin-react` recommended rules (React 19, JSX runtime)
   - Adds `eslint-plugin-react-hooks` recommended rules

3. **Ignores:**
   - `**/dist/**`
   - `**/node_modules/**`
   - `**/*.d.ts`
   - `worker-configuration.d.ts`

**Root devDependencies added:**
- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-config-prettier`

Each workspace (dashboard, sdk, cli, packages/schemas) gets a `"lint": "eslint src"` script in its `package.json`.

## Prettier Configuration

**Files:**
- `.prettierrc` at root
- `.prettierignore` at root

**`.prettierrc` settings:**
```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": []
}
```

**`.prettierignore` covers:**
- `dist/`
- `node_modules/`
- `**/*.d.ts`
- `worker-configuration.d.ts`
- `package-lock.json`

**Root scripts added:**
- `"format": "prettier --write ."` — formats all files
- `"format:check": "prettier --check ."` — fails if unformatted (for CI)

**Root devDependencies added:**
- `prettier`

## Husky + lint-staged

**Root devDependencies added:**
- `husky`
- `lint-staged`

**`package.json` changes:**
- Add `"prepare": "husky"` to scripts
- Add `lint-staged` config:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,json,md,css,html}": ["prettier --write"]
}
```

**Hook file:** `.husky/pre-commit` — runs `npx lint-staged`

## Turbo Integration

**`turbo.json` changes:** Add `lint` task:

```json
"lint": {
  "dependsOn": ["^build"],
  "cache": true
}
```

`dependsOn: ["^build"]` ensures type-aware ESLint rules have access to built type declarations from dependency packages (e.g., `@edgestat/schemas`).

**Root `package.json` script added:**
- `"lint": "turbo run lint"`

## Scripts Summary

| Location | Script | Purpose |
|----------|--------|---------|
| Root | `npm run lint` | Turbo lint all workspaces |
| Root | `npm run format` | Prettier write all files |
| Root | `npm run format:check` | Prettier check (CI) |
| Root | `npm run typecheck` | Already exists — unchanged |
| Pre-commit | automatic | ESLint fix + Prettier on staged files |
| Each workspace | `npm run lint` | ESLint that workspace's `src/` |

## Files Created / Modified

| File | Action |
|------|--------|
| `eslint.config.js` | Create |
| `.prettierrc` | Create |
| `.prettierignore` | Create |
| `.husky/pre-commit` | Create |
| `package.json` (root) | Modify — add scripts, devDeps, lint-staged, prepare |
| `turbo.json` | Modify — add lint task |
| `dashboard/package.json` | Modify — add lint script |
| `sdk/package.json` | Modify — add lint script |
| `cli/package.json` | Modify — add lint script |
| `packages/schemas/package.json` | Modify — add lint script |
