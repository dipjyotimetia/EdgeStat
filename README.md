# EdgeStat

![open source](https://img.shields.io/badge/open%20source-edgestat-00D4AA?style=flat-square&labelColor=050B14)
![cloudflare](https://img.shields.io/badge/cloudflare-native-00D4AA?style=flat-square&labelColor=050B14)
![free tier](https://img.shields.io/badge/free%20tier-only-00FFD1?style=flat-square&labelColor=050B14)

**Analytics at the edge. Owned by you.**

A privacy-first, self-hosted analytics engine built entirely on Cloudflare's
free-tier stack. No cookies, no PII, no external services — just your Cloudflare
account.

## Architecture

```
Browser/SDK                     Cloudflare Edge
    |                                |
    |  POST /v1/events (batch)       |
    |------------------------------->| Worker (fetch handler)
    |  202 Accepted                  |   | validate + enrich
    |<-------------------------------|   | SHA-256 session hash
    |                                |   v
    |                                | Queue (async buffer)
    |                                |   |
    |                                |   v
    |                                | Worker (queue consumer)
    |                                |   | batch INSERT
    |                                |   v
    |                                | D1 (SQLite)
    |                                |   events, daily_stats
    |                                |
    |  GET /api/sites/:id/stats      |
    |------------------------------->| Worker (query API)
    |  JSON response                 |   | D1 + KV cache
    |<-------------------------------|
    |                                |
    |  GET /sse/sites/:id/live       |
    |------------------------------->| Worker (SSE stream)
    |  live visitor count            |   | polls D1 every 10s
    |<~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|
    |                                |
    |  GET / (dashboard)             |
    |------------------------------->| Static Assets (React SPA)
    |<-------------------------------|
    |                                |
    |  Cron Triggers (3x daily)      |
    |                                |   | rotate salt
    |                                |   | aggregate stats
    |                                |   | archive to R2
    |                                |   | purge old data
```

### Stack

| Layer      | Service       | Free Tier           |
| ---------- | ------------- | ------------------- |
| Compute    | Workers       | 100K req/day        |
| Database   | D1 (SQLite)   | 5GB, 5M reads/day   |
| Cache      | KV            | 1GB, 100K reads/day |
| Storage    | R2            | 10GB                |
| Queue      | Queues        | ~10K ops/day        |
| Frontend   | Static Assets | Bundled with Worker |
| Scheduling | Cron Triggers | 5 per account       |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/dipjyotimetia/edgestat.git
cd edgestat
npm install
```

### 2. Copy the Wrangler config

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

> `wrangler.jsonc` is gitignored. The setup step below fills in your real resource IDs automatically.

### 3. Login to Cloudflare

```bash
npx wrangler login
```

### 4. Run setup (one command)

```bash
npm run setup
```

This automatically provisions all Cloudflare resources (D1, KV, R2, Queues),
generates a MASTER_KEY, runs migrations, builds the project, and deploys.

Options:

```bash
npm run setup -- --dry-run       # Preview commands without executing
npm run setup -- --skip-deploy   # Provision resources only, skip build/deploy
```

### 5. Open dashboard

Visit your Worker URL. The onboarding wizard will guide you through:

1. Enter your MASTER_KEY (printed by the setup CLI)
2. Create your first site
3. Copy the tracking snippet
4. Verify the first event

## Tracking Snippet

Add to your website's `<head>`:

```html
<script defer data-site="YOUR_SITE_ID" src="https://your-worker.workers.dev/s.js"></script>
```

**902 bytes gzipped.** Auto-tracks:

- Pageviews (including SPA navigation)
- Web Vitals (LCP, FCP, CLS, FID, INP)
- Screen size, referrer, UTM parameters

## TypeScript SDK

For server-side or mobile usage:

```bash
npm install edgestat-sdk
```

```typescript
import { EdgeStatClient } from 'edgestat-sdk';

const client = new EdgeStatClient({
  endpoint: 'https://your-worker.workers.dev',
  siteId: 'YOUR_SITE_ID',
});

client.trackPageview('/dashboard');
client.trackEvent('purchase', { amount: 49.99, plan: 'pro' });

// Flush on shutdown
await client.flush();
```

## API Endpoints

### Ingest

| Method | Path         | Auth    | Description                |
| ------ | ------------ | ------- | -------------------------- |
| POST   | `/v1/events` | Site ID | Batch ingest (1-20 events) |

### Query (requires Bearer master key)

| Method | Path                        | Description        |
| ------ | --------------------------- | ------------------ |
| GET    | `/api/sites`                | List all sites     |
| POST   | `/api/sites`                | Create a site      |
| GET    | `/api/sites/:id/stats`      | Overview metrics   |
| GET    | `/api/sites/:id/timeseries` | Time-bucketed data |
| GET    | `/api/sites/:id/pages`      | Top pages          |
| GET    | `/api/sites/:id/sources`    | Traffic sources    |
| GET    | `/api/sites/:id/events`     | Custom events      |
| GET    | `/api/sites/:id/realtime`   | Active visitors    |
| GET    | `/api/sites/:id/funnels`    | List funnels       |
| POST   | `/api/sites/:id/funnels`    | Create funnel      |

### Real-time

| Method | Path                  | Description               |
| ------ | --------------------- | ------------------------- |
| GET    | `/sse/sites/:id/live` | SSE stream (10s interval) |

All query endpoints accept `?from=YYYY-MM-DD&to=YYYY-MM-DD`.

## Privacy

- **No cookies** — sessions approximated via SHA-256(truncated_IP + UA +
  daily_salt)
- **IP anonymization** — last octet stripped before hashing, never stored
- **No PII** — event schema rejects arbitrary fields
- **Daily salt rotation** — session hashes change every 24h
- **Data ownership** — everything stays in your Cloudflare account
- **Auto-purge** — events deleted after 30 days (configurable)

## Dashboard

The dashboard includes:

- **Real-time panel** — live visitor count via SSE
- **Overview** — metric cards with sparkline trends
- **Charts** — area chart and bar chart breakdowns
- **Pages** — top pages sorted by views
- **Sources** — referrer and UTM campaign tables
- **Events** — filterable custom event explorer
- **Funnels** — drag-and-drop funnel builder
- **Filters** — date range picker, device/country chips

Dark mode by default. WCAG AA accessible. Fully responsive.

## Local Development

```bash
# Start the Worker locally (with miniflare)
npm run dev

# In another terminal, start the dashboard dev server
cd dashboard && npm run dev
```

The dashboard dev server proxies `/v1`, `/api`, and `/sse` to the Worker at
`localhost:8787`.

## CI/CD

[![CI](https://github.com/dipjyotimetia/EdgeStat/actions/workflows/ci.yml/badge.svg)](https://github.com/dipjyotimetia/EdgeStat/actions/workflows/ci.yml)

| Workflow          | Trigger                  | What it does                               |
| ----------------- | ------------------------ | ------------------------------------------ |
| **CI**            | Every push and PR        | Typechecks and builds all packages         |
| **Deploy Worker** | Push to `main`           | Deploys the Cloudflare Worker via Wrangler |
| **Publish SDK**   | GitHub Release published | Publishes `edgestat-sdk` to npm            |

### Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                       | Used by         | How to get it                                         |
| ---------------------------- | --------------- | ----------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`       | Deploy Worker   | Cloudflare dashboard → My Profile → API Tokens        |
| `CLOUDFLARE_ACCOUNT_ID`      | Deploy Worker   | Cloudflare dashboard → right sidebar                  |
| `CLOUDFLARE_D1_DATABASE_ID`  | Deploy Worker   | Output of `wrangler d1 list` or your `wrangler.jsonc` |
| `CLOUDFLARE_KV_NAMESPACE_ID` | Deploy Worker   | Output of `wrangler kv namespace list`                |
| `NPM_TOKEN`                  | Publish SDK/CLI | npmjs.com → Access Tokens → Automation token          |

## Project Structure

```
edgestat/
├── packages/
│   └── schemas/            # @edgestat/schemas — shared Zod schemas + TypeScript types
├── wrangler.jsonc          # Cloudflare bindings config
├── turbo.json              # Turborepo task graph
├── src/
│   ├── index.ts            # Worker entry (fetch + queue + scheduled)
│   ├── router.ts           # itty-router setup
│   ├── routes/             # API handlers
│   ├── queue/              # Queue consumer
│   ├── cron/               # Scheduled tasks
│   ├── lib/                # Schemas, types, validation, privacy, aggregation
│   └── migrations/         # D1 SQL migrations
├── dashboard/              # React 19 + Vite + Tailwind 4 SPA
├── sdk/                    # TypeScript SDK (published to npm as edgestat-sdk)
│   └── dist/               # Built SDK: ESM bundle + type declarations
└── cli/                    # Setup CLI (edgestat-cli)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

Report security issues privately — see [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE)
