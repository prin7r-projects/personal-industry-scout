"use client";

import * as React from "react";
import { SAMPLE_BRIEF } from "./scout-data";

type Props = {
  subscriber: {
    subscriberName: string;
    subscriberEmail: string;
    industries: string[];
    companies: string[];
    geos: string[];
    tz: string;
    intakeId: string;
  };
  onBack: () => void;
};

export function ScoutResults({ subscriber, onBack }: Props) {
  const filedAt = new Date(SAMPLE_BRIEF.filedAt);
  const weekLabel = `Week ${String(SAMPLE_BRIEF.isoweek).slice(-2)} · ${String(SAMPLE_BRIEF.isoweek).slice(0, 4)}`;

  return (
    <section id="results" className="border-b border-rule bg-page">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bar-oxblood" />
              <span className="tag">02 · RESULTS · SIGNED SAMPLE</span>
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tightest leading-[1.1] text-ink max-w-[24ch]">
              Your desk's signed Monday brief.
            </h2>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-medium border border-ink/15 text-ink hover:border-ink transition-colors"
          >
            <span aria-hidden className="mr-2">←</span>
            Edit intake
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          <article
            aria-label="Sample briefing — Vertical SaaS, North America, week of May 4 2026"
            className="lg:col-span-7 memo-card shadow-memo p-8 sm:p-10 lg:p-12"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="tag mb-2">SCOUT BRIEF · NO. 0247</p>
                <h3 className="font-serif text-[26px] sm:text-[30px] leading-[1.18] tracking-tightest font-semibold">
                  {SAMPLE_BRIEF.industry} · {SAMPLE_BRIEF.region}
                </h3>
                <p className="mt-2 text-caption text-graphite">
                  {weekLabel} · prepared for{" "}
                  <span className="font-mono text-[12px]">
                    {subscriber.subscriberEmail}
                  </span>{" "}
                  · 5 min read
                </p>
              </div>
              <div className="seal" aria-hidden>S</div>
            </div>

            <div className="rule-paper mt-7 mb-7" />

            <h4 className="font-mono text-[11px] tracking-[0.18em] text-ash uppercase mb-3">
              The line
            </h4>
            <p className="font-serif text-[19px] leading-[1.55] text-ink">
              {SAMPLE_BRIEF.line}
            </p>

            <div className="rule-paper mt-8 mb-7" />

            <ol className="space-y-7">
              {SAMPLE_BRIEF.items.map((item) => (
                <BriefItem
                  key={item.headline}
                  tag={`${item.tag} · ${item.date}`}
                  headline={item.headline}
                  body={item.body}
                  source={item.source}
                />
              ))}
            </ol>

            <div className="rule-paper mt-8 mb-7" />

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-serif italic text-[16px] text-ink/80">
                  — {SAMPLE_BRIEF.scoutName}, lead scout
                </p>
                <p className="tag mt-1">
                  FILED · {filedAt
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })
                    .toUpperCase()}{" "}
                  · {filedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} {SAMPLE_BRIEF.filedTz}
                </p>
              </div>
              <p className="font-mono text-[11px] tracking-widest text-ash uppercase">
                ID · {SAMPLE_BRIEF.scoutId}
              </p>
            </div>
          </article>

          <aside className="lg:col-span-5 space-y-6">
            <SubscriberCard subscriber={subscriber} weekLabel={weekLabel} />
            <DeskCard />
            <FallbackCard subscriber={subscriber} />
          </aside>
        </div>
      </div>
    </section>
  );
}

function BriefItem({
  tag,
  headline,
  body,
  source
}: {
  tag: string;
  headline: string;
  body: string;
  source: string;
}) {
  return (
    <li>
      <p className="tag mb-2">{tag}</p>
      <h4 className="font-serif text-[20px] leading-[1.3] font-semibold text-ink">
        {headline}
      </h4>
      <p className="mt-2 text-caption text-graphite text-[15px] leading-[1.65]">
        {body}
      </p>
      <p className="mt-2 font-mono text-[11px] tracking-wider text-ash">SRC · {source}</p>
    </li>
  );
}

function SubscriberCard({
  subscriber,
  weekLabel
}: {
  subscriber: Props["subscriber"];
  weekLabel: string;
}) {
  return (
    <div className="border border-rule bg-page p-6">
      <p className="tag mb-3">YOUR WATCHLIST</p>
      <p className="font-serif text-[20px] font-semibold leading-[1.2] text-ink">
        {subscriber.subscriberName}
      </p>
      <p className="mt-1 font-mono text-[12px] tracking-wider text-ash">
        {subscriber.subscriberEmail}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-[13px]">
        <div>
          <dt className="tag mb-1">INDUSTRIES</dt>
          <dd className="text-ink leading-[1.45]">
            {subscriber.industries.join(" · ")}
          </dd>
        </div>
        <div>
          <dt className="tag mb-1">REGIONS</dt>
          <dd className="text-ink leading-[1.45]">
            {subscriber.geos.join(" · ")}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="tag mb-1">COMPANIES</dt>
          <dd className="text-ink leading-[1.45]">
            {subscriber.companies.join(", ")}
          </dd>
        </div>
        <div>
          <dt className="tag mb-1">TIMEZONE</dt>
          <dd className="text-ink font-mono text-[12px]">{subscriber.tz}</dd>
        </div>
        <div>
          <dt className="tag mb-1">INTAKE</dt>
          <dd className="text-ink font-mono text-[12px]">{subscriber.intakeId}</dd>
        </div>
      </dl>

      <p className="mt-5 font-mono text-[11px] tracking-widest text-ash uppercase">
        NEXT DELIVERY · MONDAY · 06:00 LOCAL · {weekLabel}
      </p>
    </div>
  );
}

function DeskCard() {
  return (
    <div className="border border-rule bg-page p-6">
      <p className="tag mb-3">YOUR SCOUT</p>
      <p className="font-serif text-[20px] font-semibold leading-[1.2] text-ink">
        {SAMPLE_BRIEF.scoutName}
      </p>
      <p className="mt-1 text-caption text-graphite">
        Lead scout · {SAMPLE_BRIEF.industry} · {SAMPLE_BRIEF.region}
      </p>
      <p className="mt-4 text-[13px] text-graphite leading-[1.6]">
        Reply to your brief with a one-line question. You get a one-line
        answer, or a 30-minute call any week on the Concierge tier.
      </p>
      <p className="mt-4 font-mono text-[11px] tracking-widest text-ash uppercase">
        AD-HOC QUESTIONS · 2 / MONTH · OPERATOR · 8 / PARTNER · UNLIMITED · CONCIERGE
      </p>
    </div>
  );
}

function FallbackCard({ subscriber }: { subscriber: Props["subscriber"] }) {
  const subject = `Scout workspace · ${subscriber.subscriberName} · ${subscriber.industries[0] ?? "intake"}`;
  const body = `Hi desk — I'd like a hand-wired invoice for the ${subscriber.industries[0] ?? "Operator"} tier. Watchlist: ${subscriber.companies.join(", ")}. Timezone: ${subscriber.tz}.`;
  return (
    <div className="border border-rule bg-page p-6">
      <p className="tag mb-3">CONTROLLED FALLBACK</p>
      <p className="font-serif text-[20px] font-semibold leading-[1.2] text-ink">
        Need a hand-wired invoice?
      </p>
      <p className="mt-2 text-[13px] text-graphite leading-[1.6]">
        If the hosted NOWPayments flow is offline or your finance team
        needs a custom invoice, the desk will hand-wire one within
        twelve hours.
      </p>
      <a
        href={`mailto:desk@personal-industry-scout.prin7r.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
        className="mt-4 inline-flex items-center justify-center w-full h-11 px-5 text-[14px] font-medium border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors"
      >
        Email the desk
        <span aria-hidden className="ml-2">→</span>
      </a>
      <p className="mt-4 font-mono text-[11px] tracking-widest text-ash uppercase">
        desk@personal-industry-scout.prin7r.com
      </p>
    </div>
  );
}
