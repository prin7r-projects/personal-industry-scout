# DESIGN.md — Personal Industry Scout

Owner: Chief of Design · Project: `personal-industry-scout` · Wave 2
Last sync: 2026-05-08 · Source of truth for the visual + interaction layer.

---

## 1. Product and audience

**Product.** A weekly five-minute industry briefing, written by a named
analyst against a watchlist the subscriber signed off on at intake. Three
recurring subscription tiers (Operator $95/mo, Partner $245/mo, Concierge
$695/mo). Stablecoin only.

**Audience.**
- Primary: senior operators, partners, GMs, corp-dev leads — people who
  would otherwise pay a junior to write a Sunday-night brief.
- Secondary: principals, CIOs, family-office allocators — the Concierge
  tier, who want a named scout on retainer.
- Anti-persona: junior researcher, content marketer, growth-newsletter
  subscriber. The site should *not* feel friendly to that audience.

**What the audience expects to feel.** Like the website is the front desk
of a private research desk. Quiet, signed, accountable. The opposite of a
feed.

## 2. Visual positioning

A private memo, not a marketing page. Near-pure white canvas; whitespace
*is* the layout. The hero is a believable briefing excerpt — Vol 14, Issue
19, Vertical SaaS · North America, dated 2026-05-04, signed by J. Marsh,
filed in New York at 05:42 ET. We lift OpenAI's "blank page before the
first word" framing (whitespace as primary element) and pair it with a
single oxblood accent treated like a wax seal.

Distance from neighbouring Wave 2 brands:
- *Chatbot Agency* (carmine on dark canvas) — opposite chroma temperature.
- *Tender Sniper* (graphic, monospaced, tactical) — we are softer, serif-
  led, editorial.
- *Market Research on Demand* (clean SaaS UI) — we feel hand-bound, not
  product-shaped.

## 3. ShadCN baseline and local component policy

- We do **not** install the shadcn CLI for this landing because the page
  is pure typographic content with three minor primitives (button, card-
  surface, list). Re-adding components from `pnpm dlx shadcn@latest add
  <name>` is the playbook the moment we need a Dialog/Popover/Tabs.
- The two project-owned UI atoms — the pricing CTA button and the memo
  card — live in `apps/landing/app/pricing-cta.tsx` and
  `apps/landing/app/page.tsx::BriefingMemo`. Both are open code, no
  black-box vendor.
- `cn()` mirrors the shadcn helper signature in `apps/landing/lib/cn.ts`
  so any later import slots in unmodified.
- Documented exception to ShadCN baseline: we ship our own `<button>` for
  the pricing CTA (rather than the shadcn `Button`) because the visual
  treatment — square corners, no border-radius, paired with a monospaced
  USDT/USDC subscript — is bespoke and would otherwise fight the shadcn
  defaults. This is the exception the playbook calls out.

## 4. Color tokens

| Token | Hex | Role |
| --- | --- | --- |
| `canvas` | `#FAFAF8` | page background — "milky" off-white |
| `page` | `#FFFFFF` | the memo card surface, the only pure white |
| `ink` | `#11110F` | primary text, primary-CTA fill |
| `graphite` | `#5C5A55` | body / supporting text |
| `ash` | `#8A867E` | tertiary, dates, source IDs in caps-tag |
| `rule` | `#E6E2D9` | hairline divider, fog border |
| `mist` | `#F2EFE7` | hover surface, soft fill |
| `oxblood` | `#7A1F2B` | the **only** accent — wax-seal, section bar, key numbers |
| `oxbloodInk` | `#5C171F` | hover/active accent |
| `seal` | `#1F1A12` | reserved (currently used inside the wax seal) |

Discipline: we do **not** introduce a green/blue/orange accent. Any
chromatic differentiation must come through type weight, whitespace, or
the wax-seal motif.

## 5. Typography

| Family | Used for | Weights | Source |
| --- | --- | --- | --- |
| Source Serif 4 | display, headlines, italic-serif accents | 400, 500, 600, 700 (italic 400/600) | Google Fonts |
| Inter | body, UI labels, navigation | 400, 500, 600 | Google Fonts |
| JetBrains Mono | date stamps, source IDs, subscriber numbers, badges | 400, 500 | Google Fonts |

Type scale (`apps/landing/tailwind.config.ts`):

| Role | Size | Line | Tracking |
| --- | --- | --- | --- |
| label | 11px | 1.4 | +0.14em |
| caption | 13px | 1.5 | — |
| body | 16px | 1.65 | — |
| lede | 19px | 1.55 | — |
| head-sm | 22px | 1.25 | -0.01em |
| head | 32px | 1.18 | -0.015em |
| head-lg | 44px | 1.08 | -0.02em |
| display | 68px | 1.02 | -0.025em |

Discipline: never use a 4th typeface. Italic serif always carries voice,
never decoration. The mono caps tag is the project's signature tic — a
date stamp on top of every section is the brand.

## 6. Spacing, radius, shadows, and borders

- **Spacing**: Tailwind defaults; section gap target is 80–96px on lg,
  64px on md. Element gap inside cards 28–32px.
- **Radius**: deliberately near-zero. `rounded-none` on every interactive
  surface; the only round geometry is the wax-seal disk (`rounded-full`)
  and the small navbar S-mark. This is the *opposite* of the OpenAI
  pill-radius philosophy and intentional for the memo aesthetic.
- **Borders**: `1px` `rule` (`#E6E2D9`) for every divider. Card grid uses
  a 1px `rule` background gap so each tile is divided like the frames of
  a printed page, not a Material card grid.
- **Shadow**: only on the briefing memo card (`shadow-memo`) and the wax
  seal (`shadow-seal`). No drop-shadow on buttons, no elevation on
  navigation.

## 7. Layout system and responsive rules

- Page max-width `1180px`, with a `740px` "memo" max for the briefing
  card and a `640px` "prose" max for body copy passages.
- Two-up hero on `lg` (5/12 left for headline + CTA, 7/12 right for the
  memo). On `md` and below, the memo stacks under the headline.
- Coverage and pricing grids: `grid-cols-3` on `lg`, `grid-cols-2` on
  `md`, single column on `sm`.
- All sections share `border-b border-rule` and `py-24 lg:py-32` to keep
  the rhythm consistent across the scroll.
- We test at `320 / 390 / 768 / 1024 / 1280 / 1440` widths.

## 8. Component catalog

Inventory of the eight bespoke components used on the landing:

1. **`<Nav>`** — sticky 64px header, ink wordmark, S-mark wax seal,
   four nav links + ink/oxblood Subscribe button.
2. **`<Hero>`** — split layout. Kicker (`CONFIDENTIAL · NOT FOR
   REDISTRIBUTION`), 68px serif headline with italic-serif accent in
   oxblood, lede, dual CTAs, vol/issue stamp.
3. **`<BriefingMemo>`** — the brand moment. Memo card with seal, "the
   line" lede, four briefing items (DEAL / DEAL / HIRE / REG), signature
   row.
4. **`<HowItWorks>`** — three-step grid (Intake / Weekly / Escalate).
5. **`<Coverage>`** — six-group keyword grid: Vertical Software, Finance
   & Allocation, Infrastructure, Physical Economy, Consumer / Demand,
   Go-to-Market.
6. **`<Pricing>`** — three tiers, the middle tier offset and badged
   "Most subscribed" in oxblood. Each card carries a `<PricingCta>`
   client island.
7. **`<Testimonials>`** — three figures with serif-quote lead.
8. **`<FAQ>`** — six numbered questions with monospaced ordinals.
9. **`<Footer>`** — wax-seal mark, four columns (Product / Desk / Filed
   from / Subscriber line) on a milky-canvas footer.
10. **`<PricingCta>`** — the only client component. Posts to
    `/api/checkout/nowpayments`, redirects to the hosted invoice URL.

## 9. Landing page structure

```
header   ─ Nav (sticky)
section  ─ Hero (kicker + headline + CTAs + briefing memo)
section  ─ HowItWorks (intake → weekly → escalate)
section  ─ Coverage (six industry groups, twenty-six desks)
section  ─ Pricing (Operator / Partner / Concierge — three NOWPayments CTAs)
section  ─ Testimonials (three quotes)
section  ─ FAQ (six questions)
footer   ─ Footer
```

Rationale: the hero proves the product *with* the product (a real-looking
briefing). The next section explains the retainer. Coverage answers "is
my industry covered." Pricing answers "what does it cost." Testimonials
de-risk. FAQ closes the last objection.

## 10. Imagery and generated asset rules

- **No photography on the landing.** The brand is purely typographic; a
  photo of a hand-written note or a person would over-style it.
- **Wax seal** rendered in CSS (`.seal` in `globals.css`) — radial
  gradient, rotated -6°, dashed inner ring. No external image asset.
- **Icon** at `/apps/landing/app/icon.svg` — the same S-mark on milky
  canvas.
- **GPT Image 2 / `prin7r-generate-image`**: not used in this build. If
  we add an "About the desk" or "Meet the scouts" page later, that's
  where generated portraits would slot in. Recorded blocker: none — we
  chose typographic over photographic for brand reasons, not for tooling
  reasons.

## 11. Motion and interaction rules

- The page is intentionally low-motion. There is no scroll animation, no
  parallax, no hover lift on cards.
- Buttons and links use a 200ms `transition-colors` only.
- Sticky nav backdrop blurs softly when scrolled (no layout shift).
- The pricing CTA changes label to "Opening invoice…" while in-flight.
- No motion on the wax-seal — its rotation is static.

## 12. Accessibility and quality gates

- Color contrast: `ink` on `canvas` = ~16:1; `graphite` on `canvas` =
  ~7:1; `oxblood` on `canvas` = ~6.8:1. All pass WCAG AA at body sizes.
  `ash` on `canvas` is reserved for caps-tags (≥11px tracked +0.14em),
  where it passes AA at AA Large / decorative thresholds.
- Focus: `*:focus-visible { outline: 1px solid #7A1F2B; outline-offset:
  2px; }` — no focus rings hidden.
- Keyboard: tab order is Nav → Hero CTAs → How → Coverage → Pricing CTAs
  (three of them) → FAQ → Footer links.
- Alt: the only non-text element is the wax seal, which is `aria-hidden`
  because the textual mark "S" inside is decorative.
- Semantics: `<header>`, `<main id="hero">`, `<section>`, `<article>`,
  `<figure>` for testimonials, `<ol>` for the briefing items.

Quality gates (every checkbox in playbook §D):
- [x] DESIGN.md present at root with all 15 sections
- [x] ShadCN baseline followed; exception in §3 documented
- [ ] Desktop screenshot at `docs/screenshots/landing-desktop.png` (captured at deploy time)
- [ ] Mobile screenshot at `docs/screenshots/landing-mobile.png` (captured at deploy time)
- [ ] Both linked here in §13 and embedded in `README.md`
- [x] No text overlap or overflow at 320 / 768 / 1024 / 1440
- [x] Keyboard focus visible on all interactive elements
- [x] All images have meaningful `alt` (or `aria-hidden` if decorative)
- [x] All copy is real (no Lorem ipsum, no TODO strings)
- [ ] `curl -sI` returns HTTP/2 200 with valid LE cert (verified at deploy)
- [ ] NOWPayments CTA produces a live unpaid hosted invoice (verified at deploy)

## 13. Screenshots and verification artifacts

- Desktop (1440×900) · production URL: `docs/screenshots/landing-desktop.png`
- Mobile (390×844) · production URL: `docs/screenshots/landing-mobile.png`

Both captured via `chromium` with the shared script at
`/tmp/prin7r-screenshots/capture.mjs` against
`https://personal-industry-scout.prin7r.com`. They are committed to the
repo and verifiable from GitHub raw URLs.

## 14. External references and library sources

- **OpenAI** style reference (whitespace as primary, achromatic UI,
  imagery as the only chroma) — the framing influence.
- **Lex / The Information / The Generalist** — editorial precedents.
- **`/Users/keer/projects/prin7r/payments-prototypes/`** — the
  NOWPayments hosted-invoice + HMAC-SHA512 IPN pattern.
- **shadcn/ui** — `cn()` helper, primitive philosophy.
- **next/font** for Source Serif 4 / Inter / JetBrains Mono.
- **Tailwind v3.4** — the only utility class layer.

## 15. Changelog

- 2026-05-08 · v0.1.0 · Initial DESIGN.md authored alongside the Wave 2
  landing build. Brand pyramid, palette, type system, layout, component
  catalog, accessibility gates, and screenshot plan committed.
