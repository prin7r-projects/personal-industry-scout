# `apps/app/` — Subscriber Console

Stubbed in Wave 2. The subscriber console (login, account, brief archive,
ad-hoc question thread, watchlist editor, scout chat) ships in a later wave.

## Planned stack

- **Open-SaaS** (Wasp) fork — auth, billing, sessions, dashboard shell.
- **Postgres** for subscriptions, briefs, watchlists, source-doc audit trail.
- **NOWPayments hosted invoice + IPN** for monthly recurring (already wired in
  `apps/landing/app/api/checkout/nowpayments` and `…/webhooks/nowpayments`).
  When `apps/app/` ships, the IPN handler in `apps/landing` flips from
  `console.log` audit to a DB write against `subscriptions.last_paid_at`.
- **Telegram bot** for the Concierge tier's flash-note channel.

For now this is a placeholder — the landing page handles all subscriber
acquisition and the desk fulfils briefs manually until volume justifies the
build.
