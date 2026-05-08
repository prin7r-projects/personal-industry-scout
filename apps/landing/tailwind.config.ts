import type { Config } from "tailwindcss";

/**
 * Personal Industry Scout — design tokens
 * Personal-analyst-on-retainer aesthetic. Near-pure white canvas, ink primary,
 * single accent (oxblood), serif headlines + sans body + monospace for date
 * stamps & source IDs. Whitespace IS the layout.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",      // milky off-white — the page
        page: "#FFFFFF",        // pure white — memo card
        ink: "#11110F",         // primary text
        graphite: "#5C5A55",    // secondary copy
        ash: "#8A867E",         // tertiary, dates, source-ids in caps
        rule: "#E6E2D9",        // hairline divider, fog border
        mist: "#F2EFE7",        // hover surface, soft fill
        oxblood: "#7A1F2B",     // single accent — CTA, redaction marks, key numbers
        oxbloodInk: "#5C171F",  // hover/active accent
        seal: "#1F1A12"         // near-black, used for the wax-seal mark only
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"]
      },
      fontSize: {
        // tight, editorial scale
        "label": ["11px", { lineHeight: "1.4", letterSpacing: "0.14em" }],
        "caption": ["13px", { lineHeight: "1.5" }],
        "body": ["16px", { lineHeight: "1.65" }],
        "lede": ["19px", { lineHeight: "1.55" }],
        "head-sm": ["22px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "head": ["32px", { lineHeight: "1.18", letterSpacing: "-0.015em" }],
        "head-lg": ["44px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display": ["68px", { lineHeight: "1.02", letterSpacing: "-0.025em" }]
      },
      letterSpacing: {
        tightest: "-0.025em"
      },
      borderRadius: {
        none: "0",
        xs: "1px",
        sm: "2px",
        md: "4px"
      },
      boxShadow: {
        memo: "0 1px 0 0 rgba(17,17,15,0.04), 0 12px 36px -16px rgba(17,17,15,0.10)",
        seal: "0 0 0 1px rgba(122,31,43,0.18), 0 8px 24px -12px rgba(122,31,43,0.18)"
      },
      maxWidth: {
        memo: "740px",
        page: "1180px",
        prose: "640px"
      }
    }
  },
  plugins: []
};

export default config;
