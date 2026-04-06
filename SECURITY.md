# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/dipjyotimetia/edgestat/security/advisories/new).

Include:

- A description of the vulnerability and its potential impact
- Steps to reproduce
- Any suggested fix (optional)

You will receive a response within 7 days. We aim to release a fix within 30 days of confirmation.

## Security Design

EdgeStat is built with privacy as a core principle:

- **No cookies or PII** — sessions are approximated via `SHA-256(truncated_IP + UA + daily_salt)`, never stored raw
- **IP anonymization** — last octet stripped before hashing
- **Daily salt rotation** — session hashes change every 24 hours
- **MASTER_KEY** — stored as a Wrangler secret, never in config files or source code
- **Auto-purge** — raw events deleted after 30 days (configurable via `RETENTION_DAYS`)

## Deployment Security Notes

- Store your `MASTER_KEY` and Cloudflare credentials as Wrangler secrets, not in `wrangler.jsonc`
- Keep `wrangler.jsonc` out of version control (it is gitignored by default)
- Rotate your `MASTER_KEY` periodically using `wrangler secret put MASTER_KEY`
