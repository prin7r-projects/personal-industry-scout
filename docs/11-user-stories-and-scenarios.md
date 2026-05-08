# 11 · User stories and scenarios

> Personal Industry Scout sells weekly signed memos to operators who want the analyst voice on
> Monday morning. This doc enumerates how subscribers find us, what they receive, what scout
> operators do, and what we never write.

## 1. Personas summary

- **Marisa, 41, VP Corporate Development at a mid-cap vertical-SaaS holdco.** Wants Monday-morning
  briefings she can hand to her CEO. Frustrated by Pitchbook (a database, not a briefing) and
  newsletters (no accountability). Pays in USDC for line-item-able invoicing. — see
  `05-audience-profile.md` §Marisa.
- **Wei, 53, Principal of a Singapore single-family office.** Tracks four industries without staffing
  four research desks. Wants a phone number that picks up. — see `05-audience-profile.md` §Wei.
- **Scout operator (internal).** Writes the weekly brief, signs it, watermarks it to the
  subscriber. Sources every claim with a citation ID. Owns the editorial guarantee.

## 2. Primary user stories (12)

1. **As Marisa**, I want to set a watchlist at intake (industries, named companies, geographies),
   so that the briefing I get Monday is mine, not a generic template.
2. **As Marisa**, I want every brief signed with a real human name + a date + a watermark of my
   subscription email, so that it reads as analyst work product, not a mass mailing.
3. **As Marisa**, I want every claim sourced (cite ID inline), so that I can hand the brief to
   my CEO without saying "trust me."
4. **As Marisa**, I want a one-page brief (≤5 minute read) every Monday at 06:00 local, so that
   it's on my desk before standup.
5. **As Marisa**, I want to pay annually in USDC, so that my CFO has a clean invoice trail and I
   don't deal with monthly card-renewal frictions.
6. **As Wei**, I want a Concierge tier that lets me ping the scout desk on Telegram with a
   one-liner ("what changed at ServiceTitan?"), so that I don't need to staff a research desk.
7. **As Wei**, I want briefs across four industries delivered on the same Monday, so that my
   weekly mental model refreshes in one block of time.
8. **As Marisa**, I want to update my watchlist any time and have it apply to the next Monday's
   brief, so that current events drive what I track.
9. **As Marisa**, I want a 30-day refund window (no questions asked through brief 4), so that
   committing $1,200 / yr or $4,800 / yr is reversible.
10. **As scout operator**, I want a queue of "briefs due Monday 06:00" sorted by subscriber
    deadline, so that I always finish the freshest-payable subscriber first.
11. **As scout operator**, I want every claim's citation auto-checked against the source URL
    (still 200, still mentions the entity), so that no brief ships with a dead-link claim.
12. **As scout operator**, I want a "watermark + sign" tool that takes my draft + a subscriber
    record and emits the per-subscriber PDF + Postmark email, so that I'm not editing 14 copies
    by hand.

## 3. Main scenarios (happy paths)

### Scenario A — Marisa subscribes annually, watchlist drives first brief

1. **Trigger.** Marisa reads the example brief on `/`. Decides she wants this on Monday.
2. **Steps.**
   1. Picks Operator tier ($1,200 / yr). Clicks Subscribe → NOWPayments.
   2. Pays 1,200 USDC.
   3. Receives intake email with a one-time watchlist-setup link.
   4. Fills in: industries (vertical SaaS, fintech infra), named companies (ServiceTitan, Toast,
      Stripe, Adyen, ten others), geographies (NA, EMEA), language (en).
   5. Receives a confirmation: "your first brief lands Monday 2026-05-11 at 06:00 NY."
   6. Monday 06:00 — brief lands. Signed by "Hannah K., Scout — Vertical SaaS." 12 named items
      with cite IDs. 5-minute read.
3. **Success criteria.** Brief delivered on time; watermark matches Marisa's email; cite IDs
   resolve to live URLs.
4. **Frontend.** Landing, watchlist intake, brief PDF on a per-subscriber URL.
5. **Backend.** Checkout, IPN, watchlist DB, scout desk DB (Notion or apps/app Wave 3), Postmark.

### Scenario B — Wei subscribes Concierge, pings scout via Telegram

1. **Trigger.** Wei pays for Concierge tier ($4,800 / yr), four industries.
2. **Steps.**
   1. Pays 4,800 USDC.
   2. Receives intake link + Telegram-bot-pairing code.
   3. Pairs Telegram (auth via the code).
   4. Wednesday afternoon: pings bot "what changed at ServiceTitan this week?"
   5. Scout desk picks up the ticket within 4 business hours, replies with a 200-word note +
      cite IDs.
   6. Monday 06:00 — Wei receives 4 industry briefs.
3. **Success criteria.** Concierge ping replied in <4 BH; brief landed on time.

### Scenario C — Operator writes Monday brief

1. **Trigger.** Sunday 18:00. Scout desk operator opens the queue.
2. **Steps.**
   1. Filters by industry. Picks 12 candidate items from the week's source feeds.
   2. Drafts brief in markdown. Adds cite IDs.
   3. Runs `scoutctl verify` — citation checker hits each URL; one returns 404; operator replaces.
   4. Hits Sign & Watermark: per-subscriber PDFs + emails generated, queued for 06:00 Monday send.
3. **Success criteria.** All briefs in the queue signed by Sunday 22:00. Send-cron at Monday 06:00
   per-subscriber-timezone delivers without exception.

### Scenario D — Watchlist update mid-cycle

1. **Trigger.** Marisa adds 5 new companies on Tuesday.
2. **Steps.** Watchlist update writes to DB. Next Sunday's draft picks up new entities. No
   immediate brief.
3. **Success criteria.** Following Monday's brief reflects new entities.

### Scenario E — Refund within 30 days

1. **Trigger.** Marisa decides after brief 4 it's not for her.
2. **Steps.** Operator runs refund tool. NOWPayments mass-payout; subscription cancelled.
3. **Success criteria.** Refund <5 BD.

### Scenario F — Cancel-on-renewal annual

1. **Trigger.** 60 days before renewal.
2. **Steps.** System emails Marisa with renewal reminder. She clicks "do not renew." Subscription
   ends at expiry.
3. **Success criteria.** No renewal invoice generated; access ends.

## 4. Edge case scenarios

### Edge A — Subscriber forwards brief

Brief is watermarked with the subscription email + a per-brief UUID. Operator can detect leaks via
search. Forwarded copies are recoverable to the source subscriber. Anti-leak clause in TOS.

### Edge B — Source URL behind paywall

Scout uses an archived snapshot link (archive.org, archive.is) as the cite. Verifier accepts
archive URLs.

### Edge C — Scout sick

Backup operator picks up the queue. Briefs may sign by "Hannah K. (covered by James L.)" with a
note. Subscribers tolerate this; the editorial guarantee is named-accountability not specific-name.

### Edge D — Concierge ping volume spike

Per-subscriber rate limit: 5 pings / week (Concierge), 0 (Operator tier). Above that, ping queues
to a "next week" reply unless paid up.

### Edge E — A claim turns out wrong

Scout files a correction in the next brief, named, dated, with a "we got this wrong on
2026-05-11" preamble. Anti-corrections-buried policy.

### Edge F — Subscriber timezone

Per-subscriber `tz` field; brief send-time is 06:00 local. Default to UTC if unknown.

## 5. Anti-scenarios

1. **No anonymous claims.** If we can't name the source, we don't print the claim. We do not
   publish "an industry insider says…" lines.
2. **No "AI-generated brief" tier.** Briefs are written by named scouts. We will not ship a
   cheaper unsigned tier.
3. **No marketing fluff.** No weekend-funny opens, no "meanwhile in Asia" segues. The voice is
   editorial; we keep it.
4. **No web-only "feed" of past briefs to non-subscribers.** Past briefs visible only to the
   original subscriber.
5. **No referral / affiliate.** Quality of audience matters more than growth; we will not pay
   commissions for sign-ups.
