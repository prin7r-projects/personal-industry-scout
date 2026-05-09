"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

/**
 * Intake form page — collects subscriber watchlist preferences.
 *
 * Route: /intake/[token]
 * Design: white background, black-first typography, oxblood accent, neutral gray structure.
 * Fonts: Source Serif 4 (headlines), Inter (UI), JetBrains Mono (codes/stamps).
 */

const INDUSTRY_OPTIONS = [
  "Vertical SaaS",
  "Fintech / Infrastructure",
  "Private Credit",
  "AI Infrastructure",
  "Climate Hardware",
  "Consumer / Demand",
  "Go-to-Market Tech",
  "Physical Economy",
  "Healthcare IT",
  "Defense Tech",
];

const GEO_OPTIONS = [
  "North America",
  "EMEA",
  "APAC",
  "Latin America",
  "Global",
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
  "Australia/Sydney",
];

interface IntakeState {
  industries: string[];
  companies: string;
  geos: string[];
  tz: string;
  telegramPairCode: string;
}

export default function IntakePage() {
  const params = useParams();
  const token = params?.token as string;

  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IntakeState>({
    industries: [],
    companies: "",
    geos: [],
    tz: "",
    telegramPairCode: "",
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidToken(false);
      return;
    }
    // Basic check: token should have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length === 3) {
      setValidToken(true);
    } else {
      setValidToken(false);
    }
  }, [token]);

  const toggleIndustry = useCallback((industry: string) => {
    setForm((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
  }, []);

  const toggleGeo = useCallback((geo: string) => {
    setForm((prev) => ({
      ...prev,
      geos: prev.geos.includes(geo)
        ? prev.geos.filter((g) => g !== geo)
        : [...prev.geos, geo],
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.industries.length === 0) {
      setError("Select at least one industry.");
      return;
    }
    if (!form.tz) {
      setError("Select your timezone.");
      return;
    }
    if (form.telegramPairCode && !/^\d{6}$/.test(form.telegramPairCode)) {
      setError("Telegram pairing code must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industries: form.industries,
          companies: form.companies
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          geos: form.geos,
          tz: form.tz,
          telegramPairCode: form.telegramPairCode || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (validToken === null) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center">
        <p className="font-sans text-graphite">Loading…</p>
      </main>
    );
  }

  if (validToken === false) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="memo-card p-8 text-center">
            <div className="seal mx-auto mb-6">S</div>
            <h1 className="font-serif italic text-ink text-head-sm mb-3">
              Invalid or expired link
            </h1>
            <p className="font-sans text-graphite text-body leading-relaxed">
              This intake link is no longer valid. Please request a new one from
              your subscription confirmation email.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="memo-card p-8 text-center">
            <div className="seal mx-auto mb-6">S</div>
            <h1 className="font-serif italic text-ink text-head-sm mb-3">
              Watchlist saved
            </h1>
            <p className="font-sans text-graphite text-body leading-relaxed mb-6">
              Your preferences have been recorded. Your first briefing arrives
              Monday at 06:00 your local time.
            </p>
            <div className="bar-oxblood mx-auto mb-4"></div>
            {form.telegramPairCode && (
              <p className="font-mono text-ash text-caption uppercase tracking-wider">
                Telegram pairing code: {form.telegramPairCode}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-24">
        {/* Masthead */}
        <div className="text-center mb-12">
          <div className="seal mx-auto mb-4">S</div>
          <h1 className="font-serif italic text-ink text-head mb-2">
            Personal Industry Scout
          </h1>
          <p className="font-mono text-ash text-caption uppercase tracking-wider">
            Intake form
          </p>
          <div className="bar-oxblood mx-auto mt-4"></div>
        </div>

        {/* Form card */}
        <div className="memo-card p-8 lg:p-10">
          <h2 className="font-serif font-medium text-ink text-head-sm mb-2">
            Set your watchlist
          </h2>
          <p className="font-sans text-graphite text-body mb-8">
            Choose the industries, companies, and regions you want covered.
            Your first briefing arrives next Monday.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Industries */}
            <fieldset>
              <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                Industries
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRY_OPTIONS.map((industry) => (
                  <label
                    key={industry}
                    className={`flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors duration-200 text-body ${
                      form.industries.includes(industry)
                        ? "border-oxblood bg-oxblood/5 text-ink"
                        : "border-rule text-graphite hover:border-graphite"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.industries.includes(industry)}
                      onChange={() => toggleIndustry(industry)}
                      className="sr-only"
                    />
                    <span className="font-sans text-sm">{industry}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Companies */}
            <fieldset>
              <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                Companies to watch{" "}
                <span className="normal-case text-graphite">(comma-separated)</span>
              </legend>
              <input
                type="text"
                value={form.companies}
                onChange={(e) => setForm((p) => ({ ...p, companies: e.target.value }))}
                placeholder="ServiceTitan, Toast, Procore…"
                className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body placeholder:text-ash/60 focus:outline-none focus:border-oxblood transition-colors duration-200"
              />
            </fieldset>

            {/* Geos */}
            <fieldset>
              <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                Regions
              </legend>
              <div className="flex flex-wrap gap-2">
                {GEO_OPTIONS.map((geo) => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => toggleGeo(geo)}
                    className={`px-4 py-2 border font-sans text-sm transition-colors duration-200 ${
                      form.geos.includes(geo)
                        ? "border-oxblood bg-oxblood/5 text-ink"
                        : "border-rule text-graphite hover:border-graphite"
                    }`}
                  >
                    {geo}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Timezone */}
            <fieldset>
              <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                Your timezone
              </legend>
              <select
                value={form.tz}
                onChange={(e) => setForm((p) => ({ ...p, tz: e.target.value }))}
                className="w-full px-4 py-3 border border-rule bg-white font-sans text-ink text-body focus:outline-none focus:border-oxblood transition-colors duration-200"
              >
                <option value="">Select timezone…</option>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
              </select>
              <p className="font-sans text-ash text-caption mt-2">
                Briefings arrive Monday at 06:00 your local time.
              </p>
            </fieldset>

            {/* Telegram pairing */}
            <fieldset>
              <legend className="font-mono text-ash text-caption uppercase tracking-wider mb-3">
                Telegram pairing{" "}
                <span className="normal-case text-graphite">(optional)</span>
              </legend>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.telegramPairCode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    telegramPairCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                placeholder="6-digit code"
                className="w-full max-w-[160px] px-4 py-3 border border-rule bg-white font-mono text-ink text-body text-center tracking-[0.3em] placeholder:text-ash/40 focus:outline-none focus:border-oxblood transition-colors duration-200"
              />
              <p className="font-sans text-ash text-caption mt-2">
                Open @PersonalIndustryScoutBot on Telegram and send{" "}
                <code className="font-mono text-graphite">/pair</code> to get your
                6-digit code.
              </p>
            </fieldset>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 border border-oxblood/30 bg-oxblood/5">
                <p className="font-sans text-oxblood text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-ink text-white font-sans font-medium text-body tracking-wide transition-colors duration-200 hover:bg-oxblood disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Save watchlist"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
