# 13 · Implementation plan

> **Hand-off ready.** Read `01`, `02`, `11`, `12` first. Phase 0 (landing + crypto checkout +
> example brief) is COMPLETE. Phases 1–6 ship the subscriber + scout-desk runtime.
>
> **Repo:** https://github.com/prin7r-projects/personal-industry-scout
> **Live:** https://personal-industry-scout.prin7r.com (landing live)
> **Deploy:** storage-contabo `/opt/prin7r-deploys/personal-industry-scout`
> **Secrets:** NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET, POSTMARK_SERVER_TOKEN,
> TELEGRAM_BOT_TOKEN, NOTION_TOKEN (transitional), DATABASE_URL, B2_KEY_ID, B2_APP_KEY.
> **Tone:** memo. Signed. Quiet. Source Serif 4 + Inter; oxblood wax-seal accent. See
> `01-brand-identity.md` §Voice.

## Phase 0 — Wave 2 landing + checkout + example brief (DONE)

- ✅ Public landing, pricing tiers (Operator $1,200/yr, Concierge $4,800/yr), NOWPayments invoice,
  branded 503, screenshots in `/docs/screenshots/`. Signed example brief on `/example`.

## Phase 1 — Notion-backed scout desk + intake form

- **Goal.** Scout team writes briefs in Notion; system reads them, watermarks per subscriber,
  delivers Monday 06:00.
- **Tasks.**
  1. New Notion DB: Briefs (industry, isoweek, scout name, body markdown, citations).
  2. Cron `worker/sync_notion`: pull briefs nightly into Postgres `briefs` table.
  3. Watermark service: take `subscriber.email` + `briefs.body_md` + cite list → PDF (Puppeteer +
     Tailwind print stylesheet).
  4. Intake form on `apps/landing/intake/[token]`: collects industries, companies, geos, tz, and
     a 6-digit Telegram pairing code.
  5. Postmark templates: intake link, weekly brief.
  6. Cron `worker/deliver` `0 6 * * 1` per-subscriber-tz: send PDF + summary email.
- **Deps.** Phase 0; Postmark + Telegram bot live.
- **Effort.** 200 tool-uses, 10h.
- **DoD.**
  - Scenario A end-to-end: pay → intake → first Monday brief lands at 06:00 local.
  - Watermark visible + uniquely tied to subscriber UUID.

## Phase 2 — Wasp scout desk (replace Notion)

- **Goal.** Move from Notion to native Wasp UI for editing briefs + signing + verifying citations.
- **Tasks.**
  1. Stand up `apps/app` Wasp scaffold; auth = magic link.
  2. Brief editor (markdown + cite-id inserter).
  3. `scoutctl verify` CLI runs in-app: hits each cite URL, expects 2xx + entity match.
  4. Sign button: writes scout name + signed_at to brief; locks for editing.
  5. Migrate Phase 1 Notion data into Postgres on cutover.
- **Deps.** Phase 1.
- **Effort.** 180 tool-uses, 9h.
- **DoD.**
  - Scout writes a brief in the Wasp UI; verifies citations; signs; brief enters delivery queue.
  - Phase 1 Notion sync deprecated.

## Phase 3 — Concierge tier + Telegram ticket bot

- **Goal.** Wei pays Concierge, pings Telegram, scout responds within 4 BH.
- **Tasks.**
  1. Telegram bot listens for messages from paired subscribers; creates `tickets` row.
  2. Scout desk has a Tickets queue, sorted by deadline (open + 4 BH).
  3. Reply UI sends back via Telegram (and email mirror).
  4. Rate limit: 5 pings/wk Concierge; 0 Operator (with upsell prompt).
- **Deps.** Phase 2.
- **Effort.** 130 tool-uses, 6h.
- **DoD.**
  - Scenario B end-to-end.
  - Ticket response time alert at 4 BH fires.

## Phase 4 — Citation verifier + AI-assist drafting

- **Goal.** Cut scout drafting time; never ship a dead-link claim.
- **Tasks.**
  1. Citation verifier (already in CLI from Phase 2) integrated as pre-sign gate: cannot sign with
     red flag.
  2. AI-assist: scout pastes 3 source URLs + 1 thesis sentence; Claude 4.7 returns a draft 100-word
     paragraph + cite-id placeholders. Scout edits.
  3. AI-assist usage logged per scout for editorial drift checks.
- **Deps.** Phase 2.
- **Effort.** 110 tool-uses, 5h.
- **DoD.**
  - Pre-sign gate blocks dead links.
  - AI-assist endpoint returns draft within 8s p95.

## Phase 5 — Refunds + cancel-on-renewal + watermark anti-leak

- **Goal.** Self-serve cancel; operator-driven refund; leak detection.
- **Tasks.**
  1. `/me/subscription` cancel button.
  2. Operator refund tool: cancel + NOWPayments mass-payout.
  3. Anti-leak: a small daemon scans paste-bin / public Telegram channels for known watermark
     UUIDs; flags matches in operator queue.
- **Deps.** Phases 1–3.
- **Effort.** 100 tool-uses, 5h.
- **DoD.**
  - Scenario E + F end-to-end.
  - One synthetic leak detected in the leak scan.

## Phase 6 — Production polish + multi-industry concierge

- **Goal.** Sub-second cite verifier; sub-30s PDF gen; ops dashboard; concierge across 4 industries
  on one Monday.
- **Tasks.**
  1. Lighthouse pass on `/`; LCP < 2.4s.
  2. Loki + Grafana; alerts wired.
  3. Backup job: weekly Postgres dump → B2.
  4. Concierge multi-industry: Wei pays once, gets 4 industry briefs same Monday.
- **Deps.** Phases 1–5.
- **Effort.** 130 tool-uses, 6h.
- **DoD.**
  - p95 latencies hit 12-tech-spec §9 budgets.
  - Backup restore drill passes.
  - Wei's Concierge subscription lands 4 briefs same Monday.

## Cross-cutting concerns

- **Accessibility:** WCAG AA on landing + reading view.
- **i18n:** EN only Wave 2/3.
- **Mobile:** PDF reads on phone (responsive sized columns); intake form mobile-usable Phase 1.
- **Telemetry:** Phase 1 logs; Phase 6 metrics + alerts.

## Risk register

| Risk | Owner | Mitigation |
|---|---|---|
| Brief leak by subscriber | Ops | Watermark + leak-scan daemon; TOS clause. |
| Scout sick on Sunday | Editor-in-chief | Backup operators trained; "covered by" signing pattern. |
| Cite URL link-rot | Eng | Phase 4 verifier + archive.org fallback. |
| LLM-drift in AI-assist | Editor-in-chief | AI-assist usage logged; quarterly editorial review. |
| Email deliverability | Ops | Custom domain DKIM/SPF/DMARC; Postmark + Mailgun fallback. |

## Resume instructions

1. `git clone https://github.com/prin7r-projects/personal-industry-scout && cd personal-industry-scout`
2. Read `01`, `02`, `11`, `12`.
3. Pick the next phase whose DoD is unmet.
