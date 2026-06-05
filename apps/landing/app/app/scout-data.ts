export type ScoutIndustry = {
  id: string;
  name: string;
  region: string;
};

export type ScoutBriefItem = {
  tag: "DEAL" | "HIRE" | "REG" | "RELEASE" | "FUNDING";
  date: string;
  headline: string;
  body: string;
  source: string;
};

export type ScoutBrief = {
  scoutId: string;
  scoutName: string;
  industry: string;
  region: string;
  isoweek: number;
  filedAt: string;
  filedTz: string;
  line: string;
  items: ScoutBriefItem[];
};

export const SAMPLE_BRIEF: ScoutBrief = {
  scoutId: "PIS-0247-VSAAS-NA-W19",
  scoutName: "J. Marsh",
  industry: "Vertical SaaS",
  region: "North America",
  isoweek: 202619,
  filedAt: "2026-05-04T05:42:00-04:00",
  filedTz: "EDT",
  line:
    "Two of your top-3 competitors took growth-stage rounds this week — both at flat-to-down marks. Pricing is the story; the customer-success layoffs at ServiceTitan tell you the consolidation playbook is live. Two named hires in your account list and one regulator letter you'll want to read before Wednesday.",
  items: [
    {
      tag: "DEAL",
      date: "2026-04-29",
      headline: "ServiceTitan raises $245M Series H — flat at $9.6B post.",
      body:
        "ICONIQ-led, with Bessemer and TPG following on. Existing investors took roughly 70% of the allocation; no new strategic name. Same week the company laid off 8% of CS and onboarding. Read: they are buying time to ship the contractor-payments wedge before the IPO window reopens.",
      source: "ServiceTitan blog · SEC 8-K reference · IC sources"
    },
    {
      tag: "DEAL",
      date: "2026-04-30",
      headline: "Squire (barber-shop OS) closes $58M C — Insight Partners lead.",
      body:
        "Down-round from a $750M peak to $620M. Notable because Squire pulled their card-processing margin from 2.6% to 1.9% in March. Margin compression now visibly trades against valuation. Worth a 10-minute read of their new pricing page.",
      source: "Crunchbase · public pricing diff"
    },
    {
      tag: "HIRE",
      date: "2026-05-01",
      headline: "Toast hired Daniela Mehler-Ruiz as VP, Mid-Market Sales.",
      body:
        "Daniela is on your account-watch (joined from Block · Cash for Business, previously Square). She closed the gym-chain segment for Square in 2023. Toast was the biggest gap in your watchlist — this is the one you'll want to send a note to.",
      source: "LinkedIn · Toast investor day Q&A"
    },
    {
      tag: "REG",
      date: "2026-05-02",
      headline: "CFPB §1033 final rule lands — open-banking access in 18 months.",
      body:
        "Verticalised SaaS that leans on Plaid token economics gets a real compliance bill. Three of your portfolio names ship by next quarter with token-relay code that needs to be re-architected. We've flagged the four sections that change for vertical SaaS specifically.",
      source: "CFPB.gov · 12 CFR Part 1033 · 2026-05-02"
    }
  ]
};

export const INDUSTRY_DESKS: ScoutIndustry[] = [
  { id: "vertical-saas", name: "Vertical SaaS", region: "North America" },
  { id: "fintech-infra", name: "Fintech / Infrastructure", region: "Global" },
  { id: "private-credit", name: "Private Credit", region: "Global" },
  { id: "ai-infra", name: "AI Infrastructure", region: "North America" },
  { id: "climate-hardware", name: "Climate Hardware", region: "EMEA" },
  { id: "consumer-demand", name: "Consumer / Demand", region: "North America" },
  { id: "gtm-tech", name: "Go-to-Market Tech", region: "Global" },
  { id: "healthcare-it", name: "Healthcare IT", region: "North America" },
  { id: "defense-tech", name: "Defense Tech", region: "North America" }
];

export const SAMPLE_ONBOARDING = {
  subscriberEmail: "reader@sample.prin7r.com",
  subscriberName: "Sample Subscriber",
  industries: ["Vertical SaaS", "Fintech / Infrastructure"],
  companies: ["ServiceTitan", "Toast", "Squire", "Procore"],
  geos: ["North America"],
  tz: "America/New_York",
  createdAt: "2026-04-22T11:18:00-04:00",
  intakeExpiresAt: "2026-04-29T11:18:00-04:00",
  intakeId: "INTAKE-SAMPLE-0001"
};
