"use client";

/**
 * [SCOUT_PRICING_CTA] Client island — each pricing-tier "Subscribe" button.
 * Collects the subscriber's email, then posts to /api/checkout/nowpayments
 * and redirects to the hosted invoice URL.
 */

import * as React from "react";
import type { PlanId } from "@/lib/nowpayments";

type Props = {
  plan: PlanId;
  label: string;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

export function PricingCta({ plan, label, variant = "primary", fullWidth = false }: Props) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<State>({ kind: "idle" });

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "pending") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setState({ kind: "error", message: "Enter your email to continue." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState({ kind: "error", message: "A valid email is required." });
      return;
    }

    setState({ kind: "pending" });
    try {
      const response = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, email: trimmed })
      });
      const data = (await response.json()) as { invoice_url?: string; message?: string };
      if (response.ok && data.invoice_url) {
        window.location.assign(data.invoice_url);
        return;
      }
      const message =
        data?.message ??
        "We couldn't open the invoice. Email desk@personal-industry-scout.prin7r.com and the scout will hand-wire it.";
      setState({ kind: "error", message });
    } catch {
      setState({
        kind: "error",
        message:
          "Network error. Try once more, or email desk@personal-industry-scout.prin7r.com and we'll hand-wire it."
      });
    }
  }

  // Primary: ink fill, bone text. Ghost: bone fill, ink text + 1px ink border.
  const buttonClass =
    variant === "ghost"
      ? "inline-flex items-center justify-center gap-2 h-12 px-5 text-[14px] font-medium font-sans border border-ink text-ink bg-transparent hover:bg-ink hover:text-canvas transition-colors duration-200 rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
      : "inline-flex items-center justify-center gap-2 h-12 px-5 text-[14px] font-medium font-sans border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors duration-200 rounded-none disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className={fullWidth ? "w-full" : undefined}>
      <form onSubmit={subscribe} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.kind === "error") setState({ kind: "idle" });
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className={`w-full px-4 py-3 border bg-white font-sans text-ink text-[14px] placeholder:text-ash/50 focus:outline-none focus:border-oxblood transition-colors duration-200 ${
            state.kind === "error" && !email.trim() ? "border-oxblood/40" : "border-rule"
          }`}
        />
        <button
          type="submit"
          disabled={state.kind === "pending"}
          aria-label={`${label} — subscribe via NOWPayments hosted invoice (USDT or USDC)`}
          className={`${buttonClass} ${fullWidth ? "w-full" : ""}`}
        >
          {state.kind === "pending" ? "Opening invoice…" : label}
          <span aria-hidden className="font-mono text-[11px] tracking-widest text-canvas/70">
            {state.kind === "pending" ? "" : "USDT / USDC"}
          </span>
        </button>
      </form>
      {state.kind === "error" ? (
        <p className="mt-3 text-[12px] text-oxblood">
          {state.message}{" "}
          <a className="underline decoration-1 underline-offset-2" href="mailto:desk@personal-industry-scout.prin7r.com">
            Email the scout.
          </a>
        </p>
      ) : null}
    </div>
  );
}
