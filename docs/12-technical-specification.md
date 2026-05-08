# 12 · Technical specification

> Personal Industry Scout = landing + crypto checkout + scout desk (Notion-backed today, Wasp/SaaS
> in Wave 3) + Monday-cadence delivery (Postmark + Telegram). This doc is the implementer's contract.

## 1. Architecture overview

```mermaid
flowchart LR
  Edge[storage-contabo · Traefik] --> L[apps/landing · Next.js 15]
  L --> CK[/api/checkout/nowpayments] --> NP[NOWPayments]
  NP --> WH[/api/webhooks/nowpayments]
  L --> INTAKE[/intake/:token] --> APP[apps/app · Wave 3 Wasp]
  APP --> PG[(Postgres)]
  APP --> TG[Telegram bot · scout desk]
  WORKER[worker/deliver · Mon 06:00 cron] --> APP
  WORKER --> PM[Postmark]
  WORKER --> PG
  WORKER --> WM[Watermark service · PDF gen]
  SCOUT[Scout desk operator] --> APP
  APP --> CITE[Citation verifier · curl + grep]
```

**Topology.** One VPS (storage-contabo). Landing :3000. App :3100. Postmark + Telegram bot are
external. Scout desk is the internal Wasp UI; intermediate data may live in Notion in Phase 1
before migrating to Postgres in Phase 3.

## 2. Data model

```mermaid
erDiagram
  SUBSCRIBERS ||--o{ SUBSCRIPTIONS : holds
  SUBSCRIBERS ||--|| WATCHLISTS : has
  SUBSCRIPTIONS ||--o{ ORDERS : billed
  BRIEFS ||--o{ DELIVERIES : sent
  BRIEFS ||--o{ CITATIONS : references
  SCOUTS ||--o{ BRIEFS : signed
  SUBSCRIBERS ||--o{ TICKETS : opens
  SUBSCRIBERS {
    uuid id PK
    text email UK
    text name
    text tz "default UTC"
    text telegram_user_id
    timestamptz created_at
  }
  SUBSCRIPTIONS {
    uuid id PK
    uuid subscriber_id FK
    text tier "operator|concierge"
    text status "active|cancelled|expired"
    timestamptz starts_at
    timestamptz ends_at
  }
  ORDERS {
    uuid id PK
    uuid subscription_id FK
    text invoice_id UK "NOWPayments"
    int amount_cents
    timestamptz paid_at
  }
  WATCHLISTS {
    uuid id PK
    uuid subscriber_id FK UK
    jsonb industries "[vertical-saas, fintech-infra, ...]"
    jsonb companies "[ServiceTitan, Toast, ...]"
    jsonb geos "[NA, EMEA, ...]"
    timestamptz updated_at
  }
  BRIEFS {
    uuid id PK
    text industry
    int isoweek
    uuid scout_id FK
    text status "draft|verifying|signed|delivered"
    timestamptz signed_at
  }
  CITATIONS {
    uuid id PK
    uuid brief_id FK
    text cite_id "C-2026W19-0001"
    text url
    text title
    timestamptz verified_at
  }
  DELIVERIES {
    uuid id PK
    uuid brief_id FK
    uuid subscriber_id FK
    text channel "email|telegram"
    text watermark_uuid
    text artifact_url
    timestamptz sent_at
  }
  SCOUTS {
    uuid id PK
    text name
    text industry_focus
  }
  TICKETS {
    uuid id PK
    uuid subscriber_id FK
    text body
    text response
    timestamptz opened_at
    timestamptz responded_at
  }
```

Indexes: `subscribers.email` UNIQUE, `(subscriptions.subscriber_id, subscriptions.status)`,
`(deliveries.brief_id, deliveries.subscriber_id)` UNIQUE, `briefs.industry+isoweek`.

## 3. API contracts

### Wave 2 (landing)

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/api/checkout/nowpayments` | none | `{tier, email}` | `{invoice_url, invoice_id}` |
| POST | `/api/webhooks/nowpayments` | HMAC-SHA512 | NOWPayments IPN | `{ok:true}` |
| GET | `/api/healthz` | none | — | `{status}` |

### Wave 3 (app + scout desk)

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/api/intake/:token` | one-time intake token | `{industries, companies, geos, tz, telegram_pair_code}` |
| GET | `/api/me/briefs` | session(subscriber) | — |
| POST | `/api/scout/briefs` | session(scout) | `{industry, body_md, citations[]}` |
| POST | `/api/scout/briefs/:id/verify` | session(scout) | — (runs citation verifier) |
| POST | `/api/scout/briefs/:id/sign` | session(scout) | `{}` |
| POST | `/api/scout/tickets/:id/respond` | session(scout) | `{response}` |
| POST | `/api/scout/refund/:subscription_id` | session(operator) | `{reason}` |

## 4. Integrations

| 3rd-party | Auth | Rate | Fallback |
|---|---|---|---|
| NOWPayments | x-api-key + IPN HMAC | 100 RPM | Manual invoice |
| Postmark | server token | 10k/day | Resend after retry |
| Telegram Bot API | bot token | 30/sec | Email fallback for Concierge if TG down |
| Notion (Phase 1 transitional) | integration token | 3 req/sec | n/a |
| Anthropic Claude 4.7 (Phase 4 — citation summarization) | API key | tier-1 | GLM 5.1 fallback |
| Citation verifier | curl + grep | n/a (self-hosted) | n/a |

## 5. Storage

- Postgres 16 single instance.
- B2 bucket `prin7r-pis-pdfs` for per-subscriber watermarked PDFs.
- Brief history retained forever (audit + reissue).
- Subscriber PII (name, email, tz) retained 24mo after subscription expiry, then anonymized.

## 6. Auth

- **Wave 2:** anonymous checkout.
- **Wave 3:** Wasp magic-link for subscribers. Scout desk = role flag on `users.is_scout`.
  Operator = role flag on `users.is_operator`.
- Telegram pairing: 6-digit code expiring in 10 min, single-use.

## 7. Security

- Secrets in `.env`.
- Rate limits: checkout 30/IP/hr; intake 5/IP/hr; brief endpoints session-gated.
- Audit log on every sign, every refund, every TOS-breach detection.
- Watermarking: per-delivery UUID embedded in PDF metadata + a non-obvious visible grid pattern;
  designed to identify forwarded copies without obstructing the read.
- PII: subscriber email surfaces only on the watermark page itself, redacted in any internal log.

## 8. Observability

- Pino JSON logs to Loki.
- Metrics: `pis.brief.delivered`, `pis.cite.verify_failures`, `pis.ticket.response_minutes`,
  `pis.subscription.active_count`.
- Alerts: brief not delivered by Mon 06:30 local (per-subscriber); cite verify failure >2 per
  brief; ticket response >4 BH.

## 9. Performance budgets

| Path | p50 | p95 |
|---|---|---|
| `/` LCP | 1.4s | 2.4s |
| Checkout round-trip | 700ms | 1.5s |
| Citation verifier (12 cites) | 4s | 12s |
| PDF watermark (per subscriber) | 200ms | 500ms |
| Postmark send | 200ms | 800ms |

Throughput: 100 subscribers per industry; 5 industries; 500 deliveries Monday 06:00 ±15 min.

## 10. Non-goals

- No anonymous-source briefs.
- No AI-only / unsigned tier.
- No public free archive.
- No referral / affiliate.
- No daily cadence (weekly is the product).
- No video / audio briefings (text + PDF only).
- No translations (en only Wave 2/3; ES + ZH Wave 4 candidate).
