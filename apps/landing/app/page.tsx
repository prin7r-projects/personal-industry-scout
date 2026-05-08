import * as React from "react";
import { PricingCta } from "./pricing-cta";

/**
 * Personal Industry Scout — landing page.
 * Brand frame: a private memo. Near-pure-white canvas, serif headlines,
 * monospace for date stamps & source IDs, single oxblood accent for the
 * scout's wax seal and key numbers.
 */

export default function Page() {
  return (
    <main id="hero" className="bg-canvas text-ink min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <Coverage />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}

/* ───────────────────────────── NAV ───────────────────────────── */

function Nav() {
  return (
    <header className="border-b border-rule bg-canvas/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-page mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-2.5 group" aria-label="Personal Industry Scout — home">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-oxblood text-canvas italic-serif text-[15px] font-semibold leading-none">S</span>
          <span className="font-serif italic text-[18px] font-semibold leading-none tracking-tight">
            Scout
          </span>
          <span className="hidden md:inline tag ml-1">PERSONAL · INDUSTRY · WEEKLY</span>
        </a>
        <nav aria-label="primary" className="hidden md:flex items-center gap-7 text-[14px] text-ink/80">
          <a className="hover:text-ink transition-colors" href="#how">How it works</a>
          <a className="hover:text-ink transition-colors" href="#coverage">Coverage</a>
          <a className="hover:text-ink transition-colors" href="#pricing">Pricing</a>
          <a className="hover:text-ink transition-colors" href="#faq">Questions</a>
        </nav>
        <a
          href="#pricing"
          className="inline-flex items-center justify-center h-9 px-4 text-[13px] font-medium border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors"
        >
          Subscribe
        </a>
      </div>
    </header>
  );
}

/* ───────────────────────────── HERO ───────────────────────────── */

function Hero() {
  return (
    <section className="border-b border-rule">
      <div className="max-w-page mx-auto px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-12 gap-10 lg:gap-14">
        {/* LEFT — kicker + headline + subhead + dual CTAs */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <span className="bar-oxblood" />
            <span className="tag">CONFIDENTIAL · NOT FOR REDISTRIBUTION</span>
          </div>

          <h1 className="font-serif text-[44px] sm:text-[56px] lg:text-[68px] leading-[1.02] tracking-tightest font-semibold text-ink">
            A research analyst{" "}
            <span className="italic-serif font-normal text-oxblood">on your desk,</span>{" "}
            every Monday.
          </h1>

          <p className="mt-7 text-lede text-graphite max-w-prose">
            Five minutes of reading. The deals, hires, releases and regulatory shifts
            in <em className="italic-serif">your</em> industry — distilled by an
            analyst, signed and dated. Not a feed. Not a digest. A briefing
            you'd otherwise pay an associate to write.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center h-12 px-6 text-[14px] font-medium border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors"
            >
              See the three subscriptions
              <span aria-hidden className="ml-2">→</span>
            </a>
            <a
              href="#sample"
              className="inline-flex items-center justify-center h-12 px-6 text-[14px] font-medium border border-ink/15 text-ink hover:border-ink transition-colors"
            >
              Read this week's sample
            </a>
          </div>

          <p className="mt-6 tag">
            VOL · 14 · ISSUE · 19 · DELIVERED 06:00 LOCAL · MAY 4 · 2026
          </p>
        </div>

        {/* RIGHT — the briefing memo as the hero */}
        <div id="sample" className="lg:col-span-7">
          <BriefingMemo />
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── BRIEFING MEMO ──────────────────────── */

function BriefingMemo() {
  return (
    <article
      aria-label="Sample briefing — Vertical SaaS, North America, week of May 4 2026"
      className="memo-card shadow-memo p-8 sm:p-10 lg:p-12 max-w-memo mx-auto lg:mx-0"
    >
      {/* memo header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="tag mb-2">SCOUT BRIEF · NO. 0247</p>
          <h2 className="font-serif text-[28px] sm:text-[32px] leading-[1.18] tracking-tightest font-semibold">
            Vertical SaaS · North America
          </h2>
          <p className="mt-2 text-caption text-graphite">
            Week of <span className="font-mono text-[12px]">2026-05-04</span> · prepared for{" "}
            <span className="redact">REDACTED</span> · 5 min read
          </p>
        </div>
        <div className="seal" aria-hidden>S</div>
      </div>

      <div className="rule-paper mt-7 mb-7" />

      {/* TL;DR */}
      <div>
        <h3 className="font-mono text-[11px] tracking-[0.18em] text-ash uppercase mb-3">
          The line
        </h3>
        <p className="font-serif text-[19px] leading-[1.55] text-ink">
          Two of your top-3 competitors took growth-stage rounds this week — both at
          flat-to-down marks. Pricing is the story; the customer-success layoffs at{" "}
          <strong className="font-semibold">ServiceTitan</strong> tell you the
          consolidation playbook is live. Two named hires in your account list and one
          regulator letter you'll want to read before Wednesday.
        </p>
      </div>

      <div className="rule-paper mt-8 mb-7" />

      {/* Items list — these are the "real-looking" briefing entries */}
      <ol className="space-y-7">
        <BriefItem
          tag="DEAL · 2026-04-29"
          headline="ServiceTitan raises $245M Series H — flat at $9.6B post."
          body={
            <>
              ICONIQ-led, with Bessemer and TPG following on. Existing investors took
              roughly 70% of the allocation; <em className="italic-serif">no new
              strategic name</em>. Same week the company laid off 8% of CS &amp;
              onboarding. Read: they are buying time to ship the contractor-payments
              wedge before the IPO window reopens.
            </>
          }
          source="ServiceTitan blog · SEC 8-K reference · IC sources"
        />
        <BriefItem
          tag="DEAL · 2026-04-30"
          headline="Squire (barber-shop OS) closes $58M C — Insight Partners lead."
          body={
            <>
              Down-round from a $750M peak to $620M. Notable because Squire pulled their
              card-processing margin from <span className="font-mono text-[13px]">2.6%</span> to{" "}
              <span className="font-mono text-[13px]">1.9%</span> in March. Margin compression
              now visibly trades against valuation. Worth a 10-minute read of their
              new pricing page.
            </>
          }
          source="Crunchbase · public pricing diff"
        />
        <BriefItem
          tag="HIRE · 2026-05-01"
          headline="Toast hired Daniela Mehler-Ruiz as VP, Mid-Market Sales."
          body={
            <>
              Daniela is on your account-watch (joined from Block · Cash for Business,
              previously Square). She's known for closing the gym-chain segment for
              Square in 2023. Toast was the biggest gap in your watchlist — this is
              the one you'll want to send a note to.
            </>
          }
          source="LinkedIn · Toast investor day Q&amp;A"
        />
        <BriefItem
          tag="REG · 2026-05-02"
          headline="CFPB §1033 final rule lands — open-banking access in 18 months."
          body={
            <>
              Verticalised SaaS that leans on Plaid token economics gets a real
              compliance bill. Three of your portfolio names ship by next quarter
              with token-relay code that needs to be re-architected. We've flagged
              the four sections that change for vertical SaaS specifically.
            </>
          }
          source="CFPB.gov · 12 CFR Part 1033 · 2026-05-02"
        />
      </ol>

      <div className="rule-paper mt-8 mb-7" />

      {/* footer signature row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif italic text-[16px] text-ink/80">— J. Marsh, lead scout</p>
          <p className="tag mt-1">FILED · NEW YORK · 05·04·2026 · 05:42 ET</p>
        </div>
        <p className="font-mono text-[11px] tracking-widest text-ash uppercase">
          ID · PIS-0247-VSAAS-NA-W19
        </p>
      </div>
    </article>
  );
}

function BriefItem({ tag, headline, body, source }: { tag: string; headline: string; body: React.ReactNode; source: string }) {
  return (
    <li>
      <p className="tag mb-2">{tag}</p>
      <h4 className="font-serif text-[20px] leading-[1.3] font-semibold text-ink">{headline}</h4>
      <p className="mt-2 text-caption text-graphite text-[15px] leading-[1.65]">{body}</p>
      <p className="mt-2 font-mono text-[11px] tracking-wider text-ash">SRC · {source}</p>
    </li>
  );
}

/* ───────────────────────── HOW IT WORKS ───────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      tag: "INTAKE · 30 MINUTES",
      title: "We sit with you for thirty minutes.",
      body:
        "Your industry — defined by your accounts, not a SIC code. Your competitor set, the people you watch, the regulators you fear, the deal sizes that move you. We leave with a watchlist signed at the bottom by you. Most clients take a single call.",
    },
    {
      n: "02",
      tag: "WEEKLY · MONDAY 06:00",
      title: "A briefing arrives at 06:00, your time.",
      body:
        "Five minutes of reading. The line — what changed and what it means. Four to seven items: deals, hires, releases, regulator moves. Each item carries its source ID. No fluff, no “meanwhile in Asia.” Signed by your scout.",
    },
    {
      n: "03",
      tag: "ESCALATE · ANY DAY",
      title: "Ad-hoc questions, escalation when it matters.",
      body:
        "Reply to your brief with a one-line question; you get a one-line answer. If something blows up mid-week — a regulator letter, a competitor pricing change — your scout files a flash note within the hour. White-glove, on the Concierge tier.",
    }
  ];

  return (
    <section id="how" className="border-b border-rule">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <SectionOpener kicker="HOW YOUR SCOUT WORKS" title="A retainer, not a tool." />
        <div className="mt-14 grid md:grid-cols-3 gap-px bg-rule border border-rule">
          {steps.map((s) => (
            <div key={s.n} className="bg-page p-8 lg:p-10">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-mono text-[12px] text-oxblood">{s.n}</span>
                <span className="tag">{s.tag}</span>
              </div>
              <h3 className="font-serif text-head-sm font-semibold text-ink">{s.title}</h3>
              <p className="mt-4 text-caption text-graphite text-[15px] leading-[1.7]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── COVERAGE GRID ──────────────────────── */

function Coverage() {
  const groups = [
    {
      kicker: "VERTICAL SOFTWARE",
      items: [
        "Construction & field-service SaaS",
        "Restaurant & hospitality OS",
        "Healthcare & dental practice",
        "Legal & compliance tech",
        "Logistics & warehouse",
        "K-12 / higher-ed admin"
      ]
    },
    {
      kicker: "FINANCE & ALLOCATION",
      items: [
        "Private credit & direct lending",
        "Asset-management & multi-strat",
        "Venture & growth equity",
        "Family office allocation",
        "Insurance & re-insurance",
        "Fintech infrastructure"
      ]
    },
    {
      kicker: "INFRASTRUCTURE",
      items: [
        "AI infra & inference",
        "Cybersecurity ops",
        "Developer tools",
        "Cloud cost & FinOps",
        "Data platforms",
        "Observability"
      ]
    },
    {
      kicker: "PHYSICAL ECONOMY",
      items: [
        "Specialty manufacturing",
        "Logistics & 3PL",
        "Energy & grid",
        "Climate hardware",
        "Defense procurement",
        "Mining & critical minerals"
      ]
    },
    {
      kicker: "CONSUMER / DEMAND",
      items: [
        "DTC & emerging brands",
        "Marketplace & gig",
        "Streaming & creator econ",
        "Travel & hospitality demand",
        "Restaurant chains",
        "Health & wellness"
      ]
    },
    {
      kicker: "GO-TO-MARKET",
      items: [
        "Outbound sales tooling",
        "PLG analytics",
        "Partner / channel",
        "Customer success",
        "Marketing infrastructure",
        "RevOps & data"
      ]
    }
  ];

  return (
    <section id="coverage" className="border-b border-rule bg-page">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <SectionOpener kicker="COVERAGE" title="If your industry has a Monday meeting, we cover it." />
            <p className="mt-6 text-caption text-graphite text-[15px] leading-[1.7] max-w-prose">
              We have analysts on twenty-six industry desks across North America, Europe and Asia.
              If your beat isn't named here, ask. We've stood new desks up in seven days.
            </p>
            <p className="mt-6 tag">
              26 · INDUSTRIES · COVERED · TODAY
            </p>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-rule border border-rule">
            {groups.map((g) => (
              <div key={g.kicker} className="bg-page p-7">
                <p className="tag mb-4">{g.kicker}</p>
                <ul className="space-y-2">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[14px] text-ink leading-[1.55]">
                      <span aria-hidden className="font-mono text-[12px] text-oxblood mt-0.5">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── PRICING ───────────────────────── */

function Pricing() {
  const tiers = [
    {
      id: "operator" as const,
      name: "Operator",
      kicker: "ONE INDUSTRY · WEEKLY",
      monthly: "$95",
      blurb: "For senior operators and GMs who run one industry and want the signal an associate would have written for them on Sunday night.",
      features: [
        "One industry brief, every Monday 06:00 your time",
        "Five-minute read · ~6 signal items",
        "Two ad-hoc questions answered per month",
        "Cancel any week — no annual lock-in",
        "USDT or USDC, paid weekly · monthly · annual"
      ],
      cta: "Subscribe · Operator",
      variant: "ghost" as const
    },
    {
      id: "partner" as const,
      name: "Partner",
      kicker: "TWO INDUSTRIES · WEEKLY + ALERTS",
      monthly: "$245",
      blurb: "For partners and corp-dev leads who watch two adjacent industries and need a Thursday digest in addition to the Monday brief.",
      features: [
        "Two adjacent industry briefs every Monday",
        "Thursday alert digest · 90 sec read",
        "30-minute onboarding to lock your watchlist",
        "Eight ad-hoc questions answered per month",
        "Named scout for any urgent escalation",
        "Private link to the live source-doc trail"
      ],
      cta: "Subscribe · Partner",
      featured: true,
      variant: "primary" as const
    },
    {
      id: "concierge" as const,
      name: "Concierge",
      kicker: "UP TO FOUR · DAILY ALERTS · ON RETAINER",
      monthly: "$695",
      blurb: "For principals, CIOs and CEOs who treat their scout like a chief of staff. Up to four industries, daily signal alerts, and a scout on call any week.",
      features: [
        "Up to four industry briefs",
        "Daily signal alerts in a private Telegram thread",
        "Named scout on retainer · weekly 30-min call",
        "Unlimited ad-hoc briefs on any deal · person · account",
        "Flash note within the hour on breaking moves",
        "White-glove onboarding · concierge support"
      ],
      cta: "Subscribe · Concierge",
      variant: "ghost" as const
    }
  ];

  return (
    <section id="pricing" className="border-b border-rule">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <SectionOpener kicker="PRICING" title="Three retainers. Cancel any week." />
        <p className="mt-6 max-w-prose text-caption text-graphite text-[15px] leading-[1.7]">
          Paid in stablecoin (USDT or USDC) — the same way you pay your other research providers.
          One click below opens a NOWPayments hosted invoice in your name. The first brief lands the next Monday at 06:00 your time.
        </p>

        <div className="mt-14 grid lg:grid-cols-3 gap-px bg-rule border border-rule">
          {tiers.map((t) => (
            <div
              key={t.id}
              className={`bg-page p-8 lg:p-10 flex flex-col ${t.featured ? "lg:-my-4 lg:py-12 relative" : ""}`}
            >
              {t.featured ? (
                <span className="absolute -top-3 left-8 font-mono text-[11px] tracking-widest uppercase text-canvas bg-oxblood px-2 py-1">
                  Most subscribed
                </span>
              ) : null}
              <p className="tag">{t.kicker}</p>
              <h3 className="mt-4 font-serif text-[36px] leading-[1.05] font-semibold tracking-tightest text-ink">
                {t.name}
              </h3>
              <p className="mt-5 font-serif text-[42px] font-semibold leading-none text-ink">
                {t.monthly}
                <span className="ml-2 font-sans text-[13px] font-normal text-graphite tracking-normal align-middle">
                  / month
                </span>
              </p>
              <p className="mt-5 text-[15px] text-graphite leading-[1.6]">{t.blurb}</p>
              <ul className="mt-7 space-y-2.5 text-[14px] text-ink leading-[1.5]">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span aria-hidden className="font-mono text-[12px] text-oxblood mt-1">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex-1" />
              <PricingCta plan={t.id} label={t.cta} variant={t.variant} fullWidth />
              <p className="mt-3 font-mono text-[11px] tracking-widest uppercase text-ash">
                Crypto-only · USDT · USDC · monthly
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-graphite text-center max-w-prose mx-auto">
          Need a managed annual contract, multi-seat, or a custom industry? Email{" "}
          <a className="underline decoration-1 underline-offset-2" href="mailto:desk@personal-industry-scout.prin7r.com">
            desk@personal-industry-scout.prin7r.com
          </a>{" "}
          and we'll route you to a senior scout.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── TESTIMONIALS ───────────────────────── */

function Testimonials() {
  return (
    <section className="border-b border-rule bg-page">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <SectionOpener kicker="WHAT SUBSCRIBERS SAY" title="A scout in the inbox, not another newsletter." />
        <div className="mt-14 grid md:grid-cols-3 gap-px bg-rule border border-rule">
          <Quote
            body={
              <>
                I cancelled three newsletters and my Pitchbook seat in the same week. The Monday
                brief is the first thing I read, and the only one that ever names the people I'm
                actually trying to hire.
              </>
            }
            who="Managing director, growth equity"
            place="New York · Operator"
          />
          <Quote
            body={
              <>
                The Thursday digest caught two regulator letters before our compliance team
                escalated them. The brief paid for itself in a single quarter, in the first
                week of the quarter.
              </>
            }
            who="VP Corporate Development"
            place="Boston · Partner"
          />
          <Quote
            body={
              <>
                It reads like a memo from a junior I trained myself. I never have to forward it.
                I just hand the printout across the desk and say <em className="italic-serif">read this first</em>.
              </>
            }
            who="CEO, vertical-SaaS holdco"
            place="Austin · Concierge"
          />
        </div>
      </div>
    </section>
  );
}

function Quote({ body, who, place }: { body: React.ReactNode; who: string; place: string }) {
  return (
    <figure className="bg-page p-8 lg:p-10 flex flex-col">
      <span aria-hidden className="font-serif text-[64px] leading-none text-oxblood">“</span>
      <blockquote className="mt-2 font-serif text-[19px] leading-[1.55] text-ink">{body}</blockquote>
      <figcaption className="mt-7">
        <p className="text-[13px] font-medium text-ink">{who}</p>
        <p className="tag mt-1">{place}</p>
      </figcaption>
    </figure>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */

function FAQ() {
  const items = [
    {
      q: "How is this different from a paid newsletter or Pitchbook?",
      a: "A newsletter writes one thing for thousands of readers. We write yours, for you, against the watchlist you signed off on at intake. Pitchbook hands you a database; we hand you a five-minute read with a name at the bottom and a phone number that picks up. Closer to a research analyst on retainer than a publication."
    },
    {
      q: "Who actually writes the brief?",
      a: "A named scout — usually a former bank-research, consulting, or in-house corp-dev analyst — owns your account. They write the brief, file it under their own ID, and answer your ad-hoc questions. You see their name on the bottom of every memo. No anonymous content farm."
    },
    {
      q: "Why crypto only? Can I pay by card or wire?",
      a: "Stablecoin is the cleanest rail for global subscribers and matches how senior operators already pay other research providers. We're rolling out card and wire in late Q3. Until then: pay your monthly in USDT or USDC via a NOWPayments hosted invoice. If you want a custom invoice or wire, email the desk."
    },
    {
      q: "What if I want to cancel?",
      a: "Reply to any brief with “stop.” The next Monday is your last. No annual lock-in, no clawback, no “customer success” call. The whole thing is built like a private memo retainer — you should be able to leave like one."
    },
    {
      q: "Do you cover my industry?",
      a: "We currently cover twenty-six industry desks across North America, Europe and Asia. If your beat isn't on the coverage page, email the desk and we'll either staff a desk for you in seven days or refer you to a senior scout who already covers your edge."
    },
    {
      q: "Is the data anonymised? Can I share the brief with my team?",
      a: "Each brief is signed in your name and watermarked with your subscriber ID. The Operator tier is for one reader; Partner allows three internal forwards a month; Concierge has a team-of-six allowance. Forwarding outside that is a violation of the subscriber agreement, full stop."
    }
  ];

  return (
    <section id="faq" className="border-b border-rule">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-24 lg:py-32 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <SectionOpener kicker="QUESTIONS" title="What people ask before subscribing." />
          <p className="mt-6 text-caption text-graphite text-[15px] leading-[1.7] max-w-prose">
            If your question isn't here, the desk reads every email within twelve hours.
          </p>
          <p className="mt-4">
            <a
              href="mailto:desk@personal-industry-scout.prin7r.com"
              className="text-[14px] underline decoration-1 underline-offset-4 text-ink hover:text-oxblood transition-colors"
            >
              desk@personal-industry-scout.prin7r.com
            </a>
          </p>
        </div>
        <div className="lg:col-span-8">
          <ul className="divide-y divide-rule border-y border-rule">
            {items.map((it, i) => (
              <li key={it.q} className="py-7">
                <div className="flex items-start gap-5">
                  <span className="font-mono text-[12px] text-oxblood mt-1.5 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-head-sm font-semibold text-ink">{it.q}</h3>
                    <p className="mt-3 text-[15px] text-graphite leading-[1.7]">{it.a}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FOOTER ───────────────────────── */

function Footer() {
  return (
    <footer className="bg-canvas">
      <div className="max-w-page mx-auto px-6 lg:px-10 pt-20 pb-14">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="seal" aria-hidden>S</span>
              <div>
                <p className="font-serif italic text-[24px] font-semibold leading-none">Scout</p>
                <p className="tag mt-2">PERSONAL INDUSTRY SCOUT · EST · 2026</p>
              </div>
            </div>
            <p className="mt-7 text-[15px] text-graphite leading-[1.65] max-w-prose">
              A weekly five-minute briefing on the industry you actually run.
              Distilled by a research analyst, signed and dated. Subscription, paid in stablecoin.
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="tag mb-3">PRODUCT</p>
            <ul className="space-y-2 text-[14px] text-ink/85">
              <li><a className="hover:text-oxblood" href="#how">How it works</a></li>
              <li><a className="hover:text-oxblood" href="#coverage">Coverage</a></li>
              <li><a className="hover:text-oxblood" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-oxblood" href="#sample">Sample brief</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="tag mb-3">DESK</p>
            <ul className="space-y-2 text-[14px] text-ink/85">
              <li><a className="hover:text-oxblood" href="mailto:desk@personal-industry-scout.prin7r.com">Email the desk</a></li>
              <li><a className="hover:text-oxblood" href="#faq">Questions</a></li>
              <li><a className="hover:text-oxblood" href="mailto:desk@personal-industry-scout.prin7r.com?subject=Custom+industry+desk">Custom desk</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="tag mb-3">FILED FROM</p>
            <ul className="space-y-1 text-[13px] text-graphite font-mono">
              <li>NEW YORK · LONDON · SINGAPORE</li>
              <li>BERLIN · TORONTO · DUBAI</li>
              <li>26 · INDUSTRY DESKS</li>
            </ul>
            <p className="tag mt-6">SUBSCRIBER LINE</p>
            <p className="mt-2 font-mono text-[12px] tracking-wider text-ink">
              +1 · 332 · 707 · 9412
            </p>
          </div>
        </div>

        <div className="rule-paper mt-16 pt-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-mono text-[11px] tracking-widest uppercase text-ash">
            © 2026 · PERSONAL INDUSTRY SCOUT · ALL BRIEFS WATERMARKED · NOT FOR REDISTRIBUTION
          </p>
          <p className="font-mono text-[11px] tracking-widest uppercase text-ash">
            BUILT FOR PRIN7R · PRIVACY · TERMS · SUBSCRIBER AGREEMENT
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── helpers ─────────────────────── */

function SectionOpener({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="bar-oxblood" />
        <span className="tag">{kicker}</span>
      </div>
      <h2 className="font-serif text-[34px] sm:text-[40px] lg:text-head-lg leading-[1.08] tracking-tightest font-semibold text-ink max-w-[18ch]">
        {title}
      </h2>
    </div>
  );
}
