# 09 · Go-to-Market — Personal Industry Scout

90-day plan. Each week has one outcome and a single owner.

## Pre-launch (week 0, before D-day)

- [x] Landing live at `personal-industry-scout.prin7r.com` with three NOWPayments-backed CTAs.
- [x] DESIGN.md and the 10 docs committed to the repo.
- [ ] Twelve sample-brief PDFs hand-baked (one per industry).
- [ ] Three lead scouts named (Marsh / Aslan / Cheng) with LinkedIn profiles ready.
- [ ] Founding-subscriber list: 25 personal contacts who get a hand-written DM with the sample brief.

## Weeks 1–4 — *Founding 25*

Target outcome: **25 paid subscribers** by end of week 4. All from peer-DM channel.

| Week | Outcome | Owner |
| --- | --- | --- |
| 1 | Landing public; 25 hand-DMs sent; first 5 subscribers (Operator). | CEO |
| 2 | First Monday brief sent to founding 5; their feedback in 1 doc. Sample-brief PDFs live behind email gate. | Lead scout |
| 3 | 25 more DMs; first newsletter sponsorship placement (The Generalist). +10 subs. | CMO |
| 4 | Founding-subscriber breakfast in NY (5 attendees, 3 conversions). +10 subs. Total: 25. | CEO + Marsh |

## Weeks 5–8 — *Steady drip*

Target outcome: **+25 subscribers** in this block; total ~50. First Concierge subscriber.

| Week | Outcome | Owner |
| --- | --- | --- |
| 5 | First lead-scout LinkedIn essay published (Marsh on vertical-SaaS down-rounds). | Marsh |
| 6 | Second newsletter placement (Lenny's). LinkedIn post #2. | CMO |
| 7 | London breakfast (Aslan), 5 attendees. First Concierge subscriber from this room. | Aslan |
| 8 | Coverage announcement — "We stood up the Defense Procurement desk." Trade-pub placement. | CMO |

## Weeks 9–12 — *Press the wedge*

Target outcome: **+50 subscribers**; total ~100. First "100-subscriber" public post.

| Week | Outcome | Owner |
| --- | --- | --- |
| 9 | Singapore breakfast (Cheng). Two FO conversions to Concierge. | Cheng |
| 10 | Third newsletter placement (Stratechery). LinkedIn post #3. | CMO |
| 11 | Multi-seat Partner contract closes (mid-cap PE shop, 4 seats). | CEO |
| 12 | "100 subscribers" public post. Coverage = 18 desks, target 26 by Q4 close. | CEO |

## Tracking dashboard

We track only six numbers, weekly, in a single doc:

1. **Paid subscribers** — total + this-week net.
2. **MRR** — trivial calculation against tier mix.
3. **Forwarded-brief signups** — peer referrals received.
4. **Reply-rate** on the brief — engagement health.
5. **DMs sent vs replies** — channel health for the manual outbound.
6. **Cancellations** — by tier, by industry, with named reason.

Anything else is noise.

## Risks & contingencies

- **Risk**: NOWPayments rejects a high-volume burst (rate limits or payout review). **Mitigation**: Plisio backup wired in `apps/landing/.env.example` (forward-compat); we can flip a CTA in <2 hours if needed.
- **Risk**: a high-profile subscriber leaks a brief publicly. **Mitigation**: every brief watermarked by subscriber ID; subscriber agreement spells out enforcement; we will, in fact, enforce. The watermark is a feature, not a threat.
- **Risk**: an analyst burns out at 25 subscribers per desk. **Mitigation**: tier the desk so 20 is the soft cap before we add an associate scout. The named scout's name stays on the brief; the associate writes the first draft.

## Success criteria for "GTM is working"

- 100 paid subscribers by week 12.
- ≥30% of weeks-5+ acquisition from forwarded-brief peer referral.
- ≤3% monthly churn.
- ≥1 Concierge subscriber per breakfast event.
