# Contributing to EdgeStat

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/dipjyotimetia/edgestat.git
cd edgestat
npm install

# Copy the example Wrangler config and fill in your IDs
cp wrangler.example.jsonc wrangler.jsonc
# Edit wrangler.jsonc with your Cloudflare resource IDs, or run:
npm run setup
```

### Running locally

```bash
# Start the Worker (Miniflare)
npm run dev

# In another terminal, start the dashboard dev server
cd dashboard && npm run dev
```

### Typecheck and lint

```bash
npm run typecheck
npm run lint
npm run format:check
```

## Pull Request Guidelines

- Open an issue first for significant changes so we can discuss the approach.
- Keep PRs focused — one feature or fix per PR.
- Ensure `npm run typecheck` and `npm run lint` pass before submitting.
- Follow the existing code style (enforced by Prettier and ESLint).
- Add a clear description of what the change does and why.

## Project Structure

```
edgestat/
├── packages/schemas/   # Shared Zod schemas and TypeScript types
├── src/                # Cloudflare Worker (fetch handler, queue consumer, cron)
├── dashboard/          # React 19 + Vite SPA
├── sdk/                # TypeScript SDK (published as edgestat-sdk)
└── cli/                # Setup CLI (published as edgestat-cli)
```

## Reporting Issues

Use [GitHub Issues](https://github.com/dipjyotimetia/edgestat/issues). For security vulnerabilities, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
