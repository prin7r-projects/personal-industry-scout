# Personal Industry Scout

> A research analyst on your desk, every Monday. Five minutes of reading.
> The deals, hires, releases and regulatory shifts in *your* industry —
> distilled by an analyst, signed and dated.

- **Live**: https://personal-industry-scout.prin7r.com
- **Notion opportunity**: https://www.notion.so/Personal-industry-scout-3543ceec2619817a859efd13186a8fd8
- **Wave**: 2 · 2026

## What this is

A subscription product for senior operators, partners, GMs, principals,
CIOs, corp-dev leads — anyone who would otherwise pay an associate to
write the Sunday-night brief on their industry.

Three tiers — **Operator** ($95/mo), **Partner** ($245/mo), **Concierge**
($695/mo) — paid in USDT or USDC via a NOWPayments hosted invoice. Cancel
any week.

## Repo layout

```
/apps/landing/        Next.js 15 (App Router) + Tailwind — the marketing site
  /app/                  page.tsx · pricing-cta.tsx · layout.tsx · icon.svg
  /app/api/              checkout/nowpayments · webhooks/nowpayments
  /lib/                  env.ts · cn.ts · nowpayments.ts (HMAC-SHA512 verifier)
/apps/app/            Stub for the subscriber console (Wave-N)
/docs/                 The 10 strategy docs (brand, architecture, … pitch)
/docs/screenshots/     Desktop + mobile production screenshots
DESIGN.md             15-section design + style guide (root)
docker-compose.yml    Single landing service · env_file: .env
Dockerfile.landing    Next.js 15 standalone multistage build
```

## Brand at a glance

- **Essence**: a private memo, not a feed.
- **Palette**: milky canvas (`#FAFAF8`) + ink (`#11110F`) + a single oxblood
  accent (`#7A1F2B`) — used only for the wax-seal mark, the section bar, and
  pricing-tier "most subscribed" badge.
- **Type**: Source Serif 4 (display + headlines), Inter (body + UI),
  JetBrains Mono (date stamps, source IDs, subscriber numbers).
- **Voice**: signed, dated, accountable. Never "AI-powered." Never
  "actionable insights." Closer to *Lex Daily Edition* than to *Morning
  Brew*.

Full design language in `DESIGN.md`.

## Dev

```bash
cd apps/landing
pnpm install
pnpm dev
# → http://localhost:3000
```

To exercise the NOWPayments checkout locally, copy `.env.example` to
`.env` in the repo root and populate `NOWPAYMENTS_API_KEY` /
`NOWPAYMENTS_IPN_SECRET` from `/Users/keer/.nth-kir-keys.env`.

## Deploy

```bash
ssh storage-contabo
cd /opt/prin7r-deploys/personal-industry-scout
git pull
docker compose build
docker compose up -d
```

The deploy host's `/opt/prin7r-deploys/personal-industry-scout/.env`
holds the live NOWPayments keys (gitignored, never in this repo). The
container reads them via `env_file: .env` in `docker-compose.yml`.

Traefik on the host (in host-network mode) discovers the container via
its bridge IP and the `traefik.http.routers.personal-industry-scout.*`
labels on the service.

### Worker scheduling

Workers are one-shot containers triggered by the host cron daemon:

```bash
# Install the cron schedule on the deploy host
crontab /opt/prin7r-deploys/personal-industry-scout/scripts/crontab.example
```

The schedule (see `scripts/crontab.example`):
- **sync_notion** — daily 03:00 UTC — pulls briefs from Notion
- **deliver** — Monday 06:00 UTC — generates + emails watermarked briefs
- **tender_intake** — every 6 hours — fetches open tenders
- **scout_signals** — daily 02:00 UTC — fetches industry signals per scout

Each worker needs its env vars set in the deploy host's `.env` file
(NOTION_TOKEN, BRAVE_API_KEY, TENDER_SOURCE_URL, etc.).

## Quality screenshots

- Desktop · `docs/screenshots/landing-desktop.png` · 1440×900 · production URL
- Mobile · `docs/screenshots/landing-mobile.png` · 390×844 · production URL

## Licence

MIT — see `LICENSE`.

---

*Filed under the wax seal. Built for Prin7r.*
