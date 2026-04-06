# Shared Schema Package Design

**Date:** 2026-04-06  
**Status:** Approved  
**Scope:** Extract schemas, types, and error contracts into a dedicated `packages/schemas` workspace package consumed by the Worker, SDK, and Dashboard.

---

## Problem

Schema definitions are scattered and manually duplicated across three packages:

| Value | Defined in | Duplicated in |
|-------|-----------|---------------|
| `vital_name` union | `src/lib/schemas.ts` (vitalNameEnum) | `src/lib/types.ts` (AnalyticsEvent) + `sdk/src/client.ts` (EventPayload) |
| `type` union | `src/lib/schemas.ts` (eventTypeEnum) | `src/lib/types.ts` + `sdk/src/client.ts` |
| `device_type` union | `src/lib/schemas.ts` (deviceTypeEnum) | `src/lib/types.ts` |
| Error response shape | `src/lib/schemas.ts` (single generic errorResponseSchema) | Route handlers return ad-hoc strings |

There is no mechanical sync between these copies — a change to `schemas.ts` requires manual updates to `types.ts` and the SDK. The OpenAPI spec uses a single generic `{ error: string }` for all error responses, losing HTTP status discrimination. The SDK's `EventPayload` has a known type bug (`vital_name?: string` instead of the correct union).

---

## Goal

A single `packages/schemas` workspace package that is the canonical source for:
- All shared primitive const arrays and union types
- All Zod validation schemas (Worker runtime)
- All HTTP error response shapes (typed per status code, discriminated union)
- A consistent Zod parse result envelope shared across packages
- The OpenAPI document

Worker, SDK, and Dashboard all import from this package. No type is defined more than once.

---

## Package Structure

```
packages/
└── schemas/
    ├── src/
    │   ├── types.ts     ← const arrays + plain TS interfaces, zero Zod (browser-safe)
    │   └── index.ts     ← Zod schemas + openApiDocument, re-exports everything from types.ts
    ├── dist/            ← compiled output (gitignored)
    ├── package.json     ← name: @edgestat/schemas, dual exports
    └── tsconfig.json    ← composite: true, declaration: true, emits to dist/
```

### `package.json` exports

```json
{
  "name": "@edgestat/schemas",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".":       { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./types": { "import": "./dist/types.js",  "types": "./dist/types.d.ts" }
  },
  "scripts": {
    "build":     "tsc --build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod":        "^4.3.6",
    "zod-openapi": "^5.4.6"
  }
}
```

### `tsconfig.json`

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "lib":             ["ES2022"],
    "outDir":          "./dist",
    "rootDir":         "./src",
    "declaration":     true,
    "declarationMap":  true,
    "composite":       true,
    "noEmit":          false
  },
  "include": ["src"]
}
```

---

## Source File Contracts

### `src/types.ts` — browser-safe, zero Zod

**Primitive const arrays (canonical source for all enum values):**

```typescript
export const EVENT_TYPES  = ['pageview','session_start','session_end','custom','web_vital'] as const;
export const VITAL_NAMES  = ['FCP','LCP','CLS','FID','INP','TTFB'] as const;
export const DEVICE_TYPES = ['desktop','mobile','tablet'] as const;
export const INTERVALS    = ['hour','day'] as const;
```

**Derived union types (never hardcoded elsewhere):**

```typescript
export type EventType  = typeof EVENT_TYPES[number];
export type VitalName  = typeof VITAL_NAMES[number];
export type DeviceType = typeof DEVICE_TYPES[number];
export type Interval   = typeof INTERVALS[number];
```

**Core event payload (replaces SDK's hand-written `EventPayload`):**

```typescript
export interface EventPayload {
  type: EventType;
  url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  event_name?: string;
  event_props?: Record<string, string | number>;
  vital_name?: VitalName;
  vital_value?: number;
  screen_width?: number;
  screen_height?: number;
  timestamp?: number;
}
```

**HTTP error response shapes (discriminated by `status`):**

```typescript
export interface ValidationErrorResponse {
  error: 'validation_failed';
  status: 400;
  issues: Array<{ path: string; message: string; code: string }>;
}
export interface UnauthorizedErrorResponse { error: 'unauthorized';          status: 401 }
export interface NotFoundErrorResponse     { error: 'not_found';             status: 404; resource?: string }
export interface RateLimitErrorResponse    { error: 'rate_limited';          status: 429; retry_after?: number }
export interface ServerErrorResponse       { error: 'internal_server_error'; status: 500 }

export type ApiErrorResponse =
  | ValidationErrorResponse
  | UnauthorizedErrorResponse
  | NotFoundErrorResponse
  | RateLimitErrorResponse
  | ServerErrorResponse;
```

**Zod parse result envelope (browser-safe mirror of Zod's safe parse shape):**

```typescript
export interface ParseIssue      { path: (string | number)[]; message: string; code: string }
export interface ParseSuccess<T> { success: true;  data: T }
export interface ParseFailure    { success: false; issues: ParseIssue[] }
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;
```

---

### `src/index.ts` — Worker-only, imports Zod

Re-exports all of `types.ts`, then adds:

**Zod enums derived from const arrays (not hardcoded strings):**
```typescript
export const eventTypeEnum  = z.enum(EVENT_TYPES);
export const vitalNameEnum  = z.enum(VITAL_NAMES);
export const deviceTypeEnum = z.enum(DEVICE_TYPES);
export const intervalEnum   = z.enum(INTERVALS);
```

**All existing Zod schemas** (unchanged logic, same names):
`singleEventSchema`, `ingestBodySchema`, `createSiteSchema`, `createFunnelSchema`, `dateRangeSchema`, `timeseriesQuerySchema`, `pagesQuerySchema`, `eventsQuerySchema`, and all response schemas.

**Typed error Zod schemas** (registered in OpenAPI, one per status code):
```typescript
export const validationErrorSchema = z.object({
  error: z.literal('validation_failed'), status: z.literal(400),
  issues: z.array(z.object({ path: z.string(), message: z.string(), code: z.string() })),
}).meta({ id: 'ValidationErrorResponse' });

export const unauthorizedErrorSchema = z.object({
  error: z.literal('unauthorized'), status: z.literal(401),
}).meta({ id: 'UnauthorizedErrorResponse' });

export const notFoundErrorSchema = z.object({
  error: z.literal('not_found'), status: z.literal(404),
  resource: z.string().optional(),
}).meta({ id: 'NotFoundErrorResponse' });

export const rateLimitErrorSchema = z.object({
  error: z.literal('rate_limited'), status: z.literal(429),
  retry_after: z.number().optional(),
}).meta({ id: 'RateLimitErrorResponse' });

export const serverErrorSchema = z.object({
  error: z.literal('internal_server_error'), status: z.literal(500),
}).meta({ id: 'ServerErrorResponse' });
```

**`toParseResult` utility** (converts Zod SafeParseReturnType → ParseResult<T>):
```typescript
export function toParseResult<T>(result: z.SafeParseReturnType<unknown, T>): ParseResult<T> {
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    issues: result.error.issues.map(i => ({
      path: i.path as (string | number)[],
      message: i.message,
      code: i.code,
    })),
  };
}
```

**`openApiDocument`** — updated to reference typed error schemas per route:
- All routes add `401: UnauthorizedErrorResponse` under `security: [{ BearerAuth }]`
- Ingest route adds `400: ValidationErrorResponse`, `404: NotFoundErrorResponse`
- Site/funnel mutation routes add `400: ValidationErrorResponse`
- All routes add `500: ServerErrorResponse`

---

## Consuming Package Changes

### Worker (`src/`)

| File | Change |
|------|--------|
| `src/lib/schemas.ts` | **Deleted** — replaced by `@edgestat/schemas` |
| `src/lib/types.ts` | `AnalyticsEvent.type`, `.vital_name`, `.device_type` derive from `@edgestat/schemas/types` |
| `src/routes/*.ts` | Error responses use `satisfies ApiErrorResponse` for type checking |
| `package.json` | Remove `zod`, `zod-openapi`; add `"@edgestat/schemas": "*"` |

All imports of `'./lib/schemas.js'` → `'@edgestat/schemas'`. No logic changes.

Route handler error pattern:
```typescript
// Before
return json({ error: 'Unauthorized' }, 401);

// After
return json({ error: 'unauthorized', status: 401 } satisfies UnauthorizedErrorResponse, 401);
```

### SDK (`sdk/`)

| File | Change |
|------|--------|
| `sdk/src/client.ts` | Delete `EventPayload` interface; `export type { EventPayload, VitalName, EventType } from '@edgestat/schemas/types'` |
| `sdk/package.json` | Add `"@edgestat/schemas": "*"` to dependencies |

`sdk/build.mjs` — no change. esbuild tree-shakes type-only imports; bundle size unaffected.

### Dashboard (`dashboard/`)

| File | Change |
|------|--------|
| `dashboard/package.json` | Add `"@edgestat/schemas": "*"` to dependencies |
| `dashboard/src/api/client.ts` | `unwrap()` error type changes from `unknown` to `ApiErrorResponse` |
| Component files | Can import `VITAL_NAMES`, `EVENT_TYPES` constants for dropdowns/filters |

`schema.d.ts` (generated from openapi.json) continues to be used for the `paths` interface required by `openapi-fetch`. `@edgestat/schemas/types` is used for constants and error handling.

### `scripts/generate-openapi.ts`

One line changes:
```typescript
// Before
import { openApiDocument } from '../src/lib/schemas.js';

// After
import { openApiDocument } from '@edgestat/schemas';
```

---

## Turbo Task Graph

`packages/schemas` is added to root workspaces. All packages that depend on `@edgestat/schemas` automatically get `schemas:build` as a prerequisite via Turbo's `^build` convention.

```json
// turbo.json — no structural changes needed
// ^build already means "build all workspace dependencies first"
// Turbo reads package.json dependencies to build the graph automatically
```

Updated `generate:openapi` inputs:
```json
"generate:openapi": {
  "dependsOn": ["^build"],
  "inputs": [
    "../packages/schemas/src/index.ts",
    "../scripts/generate-openapi.ts"
  ],
  "outputs": ["src/api/openapi.json", "src/api/schema.d.ts"],
  "cache": true
}
```

Final build graph:
```
schemas:build
  ├─→ dashboard:generate:openapi → dashboard:build
  ├─→ sdk:build
  └─→ worker:typecheck
```

Root workspaces array:
```json
"workspaces": ["packages/schemas", "dashboard", "sdk", "cli"]
```

---

## What Gets Eliminated

| Before | After |
|--------|-------|
| `vital_name` union defined in 3 places | Defined once in `VITAL_NAMES` const |
| `EventPayload` hand-written in SDK | Imported from `@edgestat/schemas/types` |
| `AnalyticsEvent` hardcodes unions | Derives from `EventType`, `VitalName`, `DeviceType` |
| Single generic `errorResponseSchema` | 5 typed schemas, 1 discriminated union |
| Route handlers return untyped error strings | `satisfies ApiErrorResponse` enforces correctness |
| `unwrap()` catches `unknown` errors | Catches `ApiErrorResponse` with full type narrowing |
| OpenAPI spec shows `{ error: string }` for all failures | Shows distinct typed error per status code |

---

## Verification

```bash
# 1. Schema package builds cleanly
cd packages/schemas && npm run build

# 2. Root typecheck covers all packages
npm run typecheck

# 3. SDK bundle size unchanged
cd sdk && npm run build   # check: gzipped output must remain < 2048 bytes

# 4. OpenAPI spec regenerates correctly
npm run generate:openapi
git diff dashboard/src/api/openapi.json   # should show typed error schemas per route

# 5. Full build completes via Turbo
npm run build
```
