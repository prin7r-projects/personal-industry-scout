# AGENTS.md — Personal Industry Scout

A pnpm monorepo for a subscription-based industry briefing product. Three
tiers — Operator ($95/mo), Partner ($245/mo), Concierge ($695/mo) —
paid in stablecoin via NOWPayments.

- **Live**: https://personal-industry-scout.prin7r.com
- **Wave**: 2 · 2026
- **Node**: ≥24 (non-negotiable)
- **Package manager**: pnpm@9.15.4

## Repo map

```
apps/
  landing/     Next.js 15 (App Router) + Tailwind — the marketing site
  app/         Express stub — subscriber console (future)
  api/         Express stub — REST API (future)
packages/
  db/          Prisma (Postgres) — schema, migrations, seed, client
  intake-token/   HMAC-SHA256 token generation + verification
  postmark/       Transactional email via Postmark
  role-gate/      Role-based authorization middleware
  smoke-p1/       Phase 1 end-to-end smoke test
worker/
  deliver/         Monday briefing generation + email delivery
  scout_signals/   Signal fetcher (Brave search API)
  sync_notion/     Notion briefs → DB sync
  tender_intake/   Open tender feed ingestion
  watermark/       PDF watermarking with subscriber UUID
docs/              13 strategy docs (brand, architecture, GTM, etc.)
scripts/           crontab example, provision-number.ts
```

## Code conventions

- **TypeScript everywhere** — no plain JS outside config files. Strict mode.
- **ESM only** (`"type": "module"` in every package.json).
- **Vitest** for all test suites. No Jest.
- **`tsx`** for running TypeScript at dev/runtime (workers, scripts, smoke).
- **Path aliases**: packages reference each other with `workspace:*`.
  All internal imports use the package name (`@pis/db`, `@pis/postmark`, etc.).
- **No comments unless the logic is non-obvious.** The codebase is
  self-documenting. Do not add docstrings or JSDoc to code you write.
- **All imports from `@pis/*`** — never reach across packages via
  relative paths.
- **Brand constraints** (for UI work): oxblood (`#7A1F2B`) is the ONLY
  accent color. Three typefaces max: Source Serif 4, Inter, JetBrains Mono.
  `rounded-none` on all interactive surfaces. See `DESIGN.md` for full spec.

## Dev workflow

```bash
# Install
pnpm install

# Typecheck everything
pnpm typecheck

# Run all tests
pnpm test

# Database (requires Postgres running locally, see docker-compose)
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # seed test data
pnpm db:studio     # Prisma Studio UI

# Smoke test (requires seeded DB)
pnpm smoke:p1

# Landing dev server
cd apps/landing && pnpm dev
```

**Database**: docker-compose provides Postgres 16 on port 5432 with
credentials `pis:pis_dev`. The `.env.example` has the matching
`DATABASE_URL`.

**Environment**: copy `.env.example` to `.env` and set at minimum:
- `DATABASE_URL`
- `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` (for checkout)
- `NOTION_TOKEN` / `NOTION_BRIEFS_DATABASE_ID` (for worker-sync-notion)
- `POSTMARK_SERVER_TOKEN` (for worker-deliver)

## Testing

Workers all have `vitest run` with `*.test.ts` files. Packages and
apps are uneven — `landing`, `app`, `api`, `intake-token`, `postmark`,
and `role-gate` lack test scripts. When adding logic to those packages,
add a `"test": "vitest run"` script.

Smoke test (`smoke-p1`) exercises the full pipeline: DB → intake tokens
→ Notion sync → brief generation → watermarking → delivery. It needs a
seeded database.

## CI

Three jobs in `.github/workflows/ci.yml`: `typecheck`, `test`, `smoke`.
The smoke job spawns a Postgres 16 service container with
`postgres:postgres@localhost:5432/pis_test` (CI-only, not local).
Runs `prisma generate`, `prisma migrate deploy`, `prisma seed`, then
`pnpm smoke:p1`.

## Deployment

Docker Compose on a Contabo host behind Traefik. The deploy host's
`.env` holds live keys (never in this repo).

```bash
ssh storage-contabo
cd /opt/prin7r-deploys/personal-industry-scout
git pull
docker compose build
docker compose up -d
```

Workers run as one-shot containers via host cron (`scripts/crontab.example`).

## Design reference

`DESIGN.md` is the authoritative visual/interaction spec — color tokens,
typography scale, layout system, component catalog. Read it before any
UI work. The brand is monochromatic typography with a single oxblood
accent. No photography, no gradients, no rounded corners.
