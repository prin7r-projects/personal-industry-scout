# 01 · Brand Identity — Personal Industry Scout

## Brand pyramid

- **Essence (one word)**: *Memo.*
- **Personality (three traits)**: signed · accountable · quiet.
- **Values (three)**: editorial integrity, named accountability, deliberate scarcity.
- **Attributes (five)**: weekly cadence; analyst voice; one-page brevity; oxblood wax-seal; subscriber-only redaction.

## Positioning statement

For senior operators, partners and GMs who want the signal of a research analyst on their desk every Monday, **Personal Industry Scout** is a paid weekly briefing that distils their industry's deals, hires, releases and regulator moves into a five-minute read — unlike newsletters and Pitchbook, because every brief is signed by a named scout, watermarked to the subscriber, and tied to a watchlist the subscriber sets at intake.

## Audience persona

### Primary — Marisa, 41, VP Corporate Development, mid-cap vertical-SaaS holdco
- Goals: spot the next add-on acquisition before sell-side knows it; brief her CEO every Monday with five things; keep a defensible ICP-by-industry model.
- Frustrations: Pitchbook is a database, not a briefing. She has to assemble her own narrative from CB, Pitchbook, four newsletters and her CRO's gut. She quietly pays an associate to write a Sunday-night memo.
- Channels she lives in: Bloomberg, Slack DMs with the IB analyst class, LinkedIn, Sub-stack newsletters she'd rather not need.

### Secondary — Wei, 53, Principal of a single-family office in Singapore
- Goals: track four industries (private credit, AI infra, vertical-SaaS, climate hardware) without staffing four research desks; not get blindsided.
- Frustrations: every newsletter sells the same story; he wants a name attached to every claim and a phone number that picks up.
- Channels: WhatsApp groups with peers, Bloomberg, Telegram channels of "scouts" he half-trusts.

## Voice & tone

### Do (3)
- Sign every piece. Date every piece. Cite every claim with a source ID.
- Use short sentences and named subjects. "Daniela joined Toast." Not "a key hire was made at a competitor."
- Treat the reader like an operator, not a user. Never thank them for "subscribing".

### Don't (3)
- Don't write "AI-powered," "actionable insights," or "wartime CEOs."
- Don't pad with weekend-funny opens or "meanwhile in Asia" segues.
- Don't anonymise sources. If we can't name it, we cite the document.

### Sample sentence

> Two of your top-3 competitors took growth-stage rounds this week — both at flat-to-down marks. Pricing is the story; the customer-success layoffs at ServiceTitan tell you the consolidation playbook is live.

## Visual system

### Palette

| Role | Hex | Use |
| --- | --- | --- |
| canvas | `#FAFAF8` | page |
| page | `#FFFFFF` | memo card surface |
| ink | `#11110F` | primary text & primary CTA fill |
| graphite | `#5C5A55` | body / supporting text |
| ash | `#8A867E` | tertiary, dates, source-IDs |
| rule | `#E6E2D9` | hairlines, borders |
| oxblood | `#7A1F2B` | wax-seal mark, section bar, key numbers — the **only** accent |

### Typography

- **Source Serif 4** — display, headlines, italic-serif accents. Carries voice.
- **Inter** — body, UI, navigation. Reads as quiet structure.
- **JetBrains Mono** — date stamps, source IDs, subscriber numbers, badges.

### Logo concept

A wax seal — a small oxblood disk, rotated -6°, with a serif italic "S" centered, ringed by a single dashed inner line. Rendered in CSS so it scales, prints, and screen-grabs identically. The seal is the brand: the page IS the memo, and every memo carries the seal.

```html
<span class="seal" aria-hidden>S</span>
<style>
.seal{
  width:64px; height:64px; border-radius:9999px;
  background: radial-gradient(circle at 35% 30%, #9B2A37, #7A1F2B 55%, #5C171F);
  color:#FAFAF8; display:flex; align-items:center; justify-content:center;
  font-family: "Source Serif 4", serif; font-style:italic; font-weight:600;
  font-size:22px; letter-spacing:-0.02em; transform: rotate(-6deg);
}
.seal::after{ content:""; position:absolute; inset:4px; border-radius:9999px; border:1px dashed rgba(255,250,240,.45);}
</style>
```

### Spacing & radius

- Section gap target: 80–96px on `lg`, 64px on `md`.
- Element gap inside cards: 28–32px.
- Radius: `0` everywhere except the wax seal (`rounded-full`). This is the deliberate inverse of the OpenAI pill philosophy.

### Motion

Low. 200ms `transition-colors` only. Nav backdrop blurs on scroll. The seal does not animate.

## Forbidden

- Copying any other Wave 2 palette.
- Mimicking Anthropic / OpenAI / Vercel / Linear visual identities.
- Lorem ipsum copy.
- Stock photography of suits at a desk.
- "AI-powered."
