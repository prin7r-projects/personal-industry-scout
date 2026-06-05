"use client";

import * as React from "react";
import Link from "next/link";
import { ScoutOnboarding } from "./scout-onboarding";
import { ScoutResults } from "./scout-results";
import { SAMPLE_ONBOARDING } from "./scout-data";

type Step = "onboarding" | "results";

const STEP_LABELS: Record<Step, string> = {
  onboarding: "01 · Onboarding",
  results: "02 · Results"
};

export function ScoutWorkspace() {
  const [step, setStep] = React.useState<Step>("onboarding");
  const [completedAt, setCompletedAt] = React.useState<string | null>(null);

  const onComplete = React.useCallback(() => {
    setCompletedAt(new Date().toISOString());
    setStep("results");
  }, []);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WorkspaceNav step={step} onStep={setStep} completed={completedAt !== null} />

      <section className="border-b border-rule">
        <div className="max-w-page mx-auto px-6 lg:px-10 pt-16 pb-12 lg:pt-20 lg:pb-16">
          <div className="flex items-center gap-3 mb-7">
            <span className="bar-oxblood" />
            <span className="tag">SCOUT WORKSPACE · ONBOARDING → RESULTS</span>
          </div>
          <h1 className="font-serif text-[36px] sm:text-[44px] lg:text-[56px] leading-[1.05] tracking-tightest font-semibold text-ink max-w-[24ch]">
            Set your watchlist.{" "}
            <span className="italic-serif text-oxblood">Read the brief.</span>
          </h1>
          <p className="mt-6 text-lede text-graphite max-w-prose">
            The scout workspace is the path your subscribers walk — from a
            one-page intake form to a signed and dated sample brief. Two
            steps, no live database, no signup wall. Hand this URL to anyone
            who wants to see what the desk sends on a Monday morning.
          </p>

          <ol
            className="mt-10 grid sm:grid-cols-2 gap-px bg-rule border border-rule max-w-2xl"
            aria-label="Workspace progress"
          >
            <StepCell
              index={STEP_LABELS.onboarding}
              title="Onboarding"
              body="Industries, companies, regions, timezone. One form, one submit."
              state={step === "onboarding" ? "active" : "done"}
            />
            <StepCell
              index={STEP_LABELS.results}
              title="Results"
              body="A signed sample brief from the desk. Five-minute read."
              state={step === "results" ? "active" : "todo"}
            />
          </ol>
        </div>
      </section>

      {step === "onboarding" ? (
        <ScoutOnboarding
          initial={SAMPLE_ONBOARDING}
          onComplete={onComplete}
        />
      ) : (
        <ScoutResults
          subscriber={SAMPLE_ONBOARDING}
          onBack={() => setStep("onboarding")}
        />
      )}

      <WorkspaceFooter />
    </main>
  );
}

function StepCell({
  index,
  title,
  body,
  state
}: {
  index: string;
  title: string;
  body: string;
  state: "todo" | "active" | "done";
}) {
  const isActive = state === "active";
  const isDone = state === "done";
  return (
    <li
      className={`bg-page p-5 sm:p-6 ${isActive ? "shadow-memo" : ""}`}
      aria-current={isActive ? "step" : undefined}
    >
      <p className="tag mb-2 flex items-center gap-2">
        <span>{index}</span>
        {isDone ? <span className="text-oxblood">DONE</span> : null}
      </p>
      <h2 className="font-serif text-[20px] sm:text-[22px] font-semibold leading-[1.2] text-ink">
        {title}
      </h2>
      <p className="mt-2 text-caption text-graphite">{body}</p>
    </li>
  );
}

function WorkspaceNav({
  step,
  onStep,
  completed
}: {
  step: Step;
  onStep: (s: Step) => void;
  completed: boolean;
}) {
  return (
    <header className="border-b border-rule bg-canvas/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-page mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/app" className="flex items-center gap-2.5" aria-label="Scout workspace — home">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-oxblood text-canvas italic-serif text-[15px] font-semibold leading-none">
            S
          </span>
          <span className="font-serif italic text-[18px] font-semibold leading-none tracking-tight">
            Scout
          </span>
          <span className="hidden md:inline tag ml-1">WORKSPACE · ONBOARDING → RESULTS</span>
        </Link>
        <nav aria-label="workspace" className="hidden md:flex items-center gap-7 text-[14px] text-ink/80">
          <button
            type="button"
            onClick={() => onStep("onboarding")}
            className={`transition-colors ${step === "onboarding" ? "text-ink" : "hover:text-ink"}`}
          >
            Onboarding
          </button>
          <button
            type="button"
            onClick={() => onStep("results")}
            disabled={!completed}
            className={`transition-colors ${step === "results" ? "text-ink" : "hover:text-ink"} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Results
          </button>
          <Link className="hover:text-ink transition-colors" href="/#pricing">
            Pricing
          </Link>
        </nav>
        <Link
          href="/#pricing"
          className="inline-flex items-center justify-center h-9 px-4 text-[13px] font-medium border border-ink bg-ink text-canvas hover:bg-oxblood hover:border-oxblood transition-colors"
        >
          Subscribe
        </Link>
      </div>
    </header>
  );
}

function WorkspaceFooter() {
  return (
    <footer className="bg-canvas">
      <div className="max-w-page mx-auto px-6 lg:px-10 pt-14 pb-10">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="seal" aria-hidden>S</span>
              <div>
                <p className="font-serif italic text-[22px] font-semibold leading-none">Scout</p>
                <p className="tag mt-2">PERSONAL INDUSTRY SCOUT · WORKSPACE</p>
              </div>
            </div>
            <p className="mt-5 text-[14px] text-graphite leading-[1.65] max-w-prose">
              This is the public scout workspace — the path a subscriber
              walks from intake form to first signed brief. The data you
              see is seeded; the live intake form is at
              <code className="font-mono text-[12px] mx-1 px-1 py-0.5 border border-rule">/intake/[token]</code>.
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="tag mb-3">WORKSPACE</p>
            <ul className="space-y-2 text-[14px] text-ink/85">
              <li><Link className="hover:text-oxblood" href="/app">Onboarding</Link></li>
              <li><Link className="hover:text-oxblood" href="/app#results">Results</Link></li>
              <li><Link className="hover:text-oxblood" href="/#pricing">Pricing</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="tag mb-3">DESK</p>
            <ul className="space-y-2 text-[14px] text-ink/85">
              <li>
                <a className="hover:text-oxblood" href="mailto:desk@personal-industry-scout.prin7r.com">
                  Email the desk
                </a>
              </li>
              <li><Link className="hover:text-oxblood" href="/#faq">Questions</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="tag mb-3">FILED FROM</p>
            <ul className="space-y-1 text-[13px] text-graphite font-mono">
              <li>NEW YORK · LONDON · SINGAPORE</li>
              <li>BERLIN · TORONTO · DUBAI</li>
              <li>26 · INDUSTRY DESKS</li>
            </ul>
          </div>
        </div>
        <div className="rule-paper mt-12 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-mono text-[11px] tracking-widest uppercase text-ash">
            © 2026 · PERSONAL INDUSTRY SCOUT · CONFIDENTIAL
          </p>
          <p className="font-mono text-[11px] tracking-widest uppercase text-ash">
            BUILT FOR PRIN7R · STABLECOIN ONLY
          </p>
        </div>
      </div>
    </footer>
  );
}
