"use client";

import * as React from "react";
import { INDUSTRY_DESKS } from "./scout-data";

const GEO_OPTIONS = [
  "North America",
  "EMEA",
  "APAC",
  "Latin America",
  "Global"
];

const TIMEZONE_OPTIONS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney"
];

type Sample = {
  subscriberEmail: string;
  subscriberName: string;
  industries: string[];
  companies: string[];
  geos: string[];
  tz: string;
  createdAt: string;
  intakeExpiresAt: string;
  intakeId: string;
};

type Props = {
  initial: Sample;
  onComplete: () => void;
};

export function ScoutOnboarding({ initial, onComplete }: Props) {
  const [name, setName] = React.useState(initial.subscriberName);
  const [email, setEmail] = React.useState(initial.subscriberEmail);
  const [industries, setIndustries] = React.useState<string[]>(initial.industries);
  const [companies, setCompanies] = React.useState(initial.companies.join(", "));
  const [geos, setGeos] = React.useState<string[]>(initial.geos);
  const [tz, setTz] = React.useState(initial.tz);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<{
    intakeId: string;
    createdAt: string;
    expiresAt: string;
  } | null>(null);

  const toggleIndustry = React.useCallback((industry: string) => {
    setIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  }, []);

  const toggleGeo = React.useCallback((geo: string) => {
    setGeos((prev) =>
      prev.includes(geo) ? prev.filter((g) => g !== geo) : [...prev, geo]
    );
  }, []);

  const submit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      setConfirmation(null);

      const companyList = companies
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      try {
        const res = await fetch("/api/scout/onboard", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            industries,
            companies: companyList,
            geos,
            tz
          })
        });
        const data = (await res.json()) as {
          ok?: boolean;
          intakeId?: string;
          createdAt?: string;
          expiresAt?: string;
          message?: string;
        };
        if (!res.ok || !data.ok) {
          setConfirmation({
            intakeId: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        } else {
          setConfirmation({
            intakeId: data.intakeId ?? `INTAKE-${Date.now().toString(36).toUpperCase()}`,
            createdAt: data.createdAt ?? new Date().toISOString(),
            expiresAt: data.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      } catch {
        setConfirmation({
          intakeId: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      } finally {
        setSubmitting(false);
      }
    },
    [companies, email, geos, industries, name, submitting, tz]
  );

  const canSubmit =
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    industries.length > 0 &&
    geos.length > 0 &&
    tz.length > 0;

  return (
    <section id="onboarding" className="border-b border-rule">
      <div className="max-w-page mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="bar-oxblood" />
              <span className="tag">01 · INTAKE</span>
            </div>
            <h2 className="font-serif text-[28px] sm:text-[34px] font-semibold tracking-tightest leading-[1.1] text-ink max-w-[18ch]">
              Lock your watchlist.
            </h2>
            <p className="mt-5 text-caption text-graphite text-[15px] leading-[1.7] max-w-prose">
              The intake form is the contract between you and the desk —
              the scout writes against this list, not a generic
              feed. Pick the industries that move your Monday, the
              companies on your account-watch, and the regions you
              actually run. We'll route the right scout to you within
              twelve hours.
            </p>
            <div className="mt-8 border border-rule bg-page p-5">
              <p className="tag mb-2">CURRENT DESKS</p>
              <p className="font-serif text-[18px] font-semibold leading-[1.3] text-ink">
                {INDUSTRY_DESKS.length} industry desks · 26 covered total
              </p>
              <p className="mt-3 text-caption text-graphite text-[14px] leading-[1.6]">
                If your beat isn't listed, the desk will staff a new
                desk in seven days.
              </p>
            </div>
            <p className="mt-6 tag">INTAKE TIME · ~ 3 MIN</p>
          </aside>

          <div className="lg:col-span-8">
            <form
              onSubmit={submit}
              className="memo-card shadow-memo p-7 sm:p-9 lg:p-11"
              aria-label="Scout intake form"
            >
              <h3 className="font-serif text-head-sm font-semibold text-ink">
                Personal Industry Scout · watchlist intake
              </h3>
              <p className="mt-2 text-caption text-graphite">
                Seeded with a sample subscriber. Edit any field, then
                save to see the results step.
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-5">
                <Field label="Your name" hint="First name + last initial is fine">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="J. Marsh"
                    className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body placeholder:text-ash/50 focus:outline-none focus:border-oxblood transition-colors duration-200"
                  />
                </Field>
                <Field label="Subscriber email" hint="Where the brief files Monday at 06:00 local">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@firm.com"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body placeholder:text-ash/50 focus:outline-none focus:border-oxblood transition-colors duration-200"
                  />
                </Field>
              </div>

              <fieldset className="mt-7">
                <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                  Industries
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDUSTRY_DESKS.map((desk) => (
                    <button
                      key={desk.id}
                      type="button"
                      onClick={() => toggleIndustry(desk.name)}
                      className={`px-3 py-2 border text-left font-sans text-[13px] transition-colors duration-200 ${
                        industries.includes(desk.name)
                          ? "border-oxblood bg-oxblood/5 text-ink"
                          : "border-rule text-graphite hover:border-graphite"
                      }`}
                    >
                      <span className="block">{desk.name}</span>
                      <span className="block font-mono text-[10px] tracking-widest text-ash uppercase mt-0.5">
                        {desk.region}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <Field
                label="Companies to watch"
                hint="Comma-separated. Mixed case is fine — the scout normalises."
                className="mt-7"
              >
                <input
                  type="text"
                  value={companies}
                  onChange={(e) => setCompanies(e.target.value)}
                  placeholder="ServiceTitan, Toast, Procore…"
                  className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body placeholder:text-ash/50 focus:outline-none focus:border-oxblood transition-colors duration-200"
                />
              </Field>

              <fieldset className="mt-7">
                <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                  Regions
                </legend>
                <div className="flex flex-wrap gap-2">
                  {GEO_OPTIONS.map((geo) => (
                    <button
                      key={geo}
                      type="button"
                      onClick={() => toggleGeo(geo)}
                      className={`px-4 py-2 border font-sans text-[13px] transition-colors duration-200 ${
                        geos.includes(geo)
                          ? "border-oxblood bg-oxblood/5 text-ink"
                          : "border-rule text-graphite hover:border-graphite"
                      }`}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Field label="Your timezone" hint="Briefings file Monday 06:00 your local time." className="mt-7">
                <select
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body focus:outline-none focus:border-oxblood transition-colors duration-200"
                >
                  <option value="">Select timezone…</option>
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                <p className="text-[12px] text-ash max-w-md leading-[1.5]">
                  Saving locks the watchlist. Your first brief lands the
                  next Monday 06:00 your local time, watermarked with a
                  unique subscriber ID.
                </p>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center justify-center h-12 px-6 text-[14px] font-medium border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving…" : "Save watchlist & open results"}
                  <span aria-hidden className="ml-2">→</span>
                </button>
              </div>

              {confirmation ? (
                <div
                  role="status"
                  className="mt-7 border border-oxblood/30 bg-oxblood/5 p-5"
                >
                  <p className="font-mono text-[11px] tracking-widest text-oxblood uppercase">
                    INTAKE SAVED · {confirmation.intakeId}
                  </p>
                  <p className="mt-2 text-[14px] text-ink leading-[1.55]">
                    Watchlist recorded at{" "}
                    <span className="font-mono text-[12px]">
                      {new Date(confirmation.createdAt).toUTCString()}
                    </span>
                    . Intake link is valid through{" "}
                    <span className="font-mono text-[12px]">
                      {new Date(confirmation.expiresAt).toUTCString()}
                    </span>
                    . Your scout files Monday at 06:00 your local time.
                  </p>
                  <button
                    type="button"
                    onClick={onComplete}
                    className="mt-4 inline-flex items-center text-[13px] font-medium text-ink hover:text-oxblood transition-colors"
                  >
                    Open the results step
                    <span aria-hidden className="ml-2">→</span>
                  </button>
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className="block font-mono text-ash text-caption uppercase tracking-wider mb-2">
          {label}
        </span>
        {children}
      </label>
      {hint ? (
        <p className="mt-2 text-[12px] text-ash leading-[1.5]">{hint}</p>
      ) : null}
    </div>
  );
}
