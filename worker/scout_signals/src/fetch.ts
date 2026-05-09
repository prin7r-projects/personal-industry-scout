/**
 * Scout signals fetcher — core logic.
 *
 * Fetches industry news signals via Brave Search API and stores them
 * in the Signal table, keyed by (industry, url) for dedup.
 */

import { PrismaClient } from "@pis/db";

const BRAVE_API_URL = "https://api.search.brave.com/res/v1/news/search";

interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  page_age?: string;
  meta_url?: {
    scheme: string;
    netloc: string;
    hostname: string;
    favicon: string;
    path: string;
  };
  thumbnail?: {
    src: string;
    original: string;
    logo: boolean;
  };
  extra_snippets?: string[];
}

interface BraveNewsResponse {
  type: "news";
  web?: { results?: BraveNewsResult[] };
  results?: BraveNewsResult[];
}

export interface FetchResult {
  scoutId: string;
  industry: string;
  total: number;
  created: number;
  skipped: number;
}

const SIGNAL_TYPE_KEYWORDS: [string, string[]][] = [
  ["funding", ["funding", "investment", "invests", "valuation", "venture", "series a", "series b", "series c", "seed round", "pre-seed"]],
  ["deal", ["acquisition", "acquired", "merger", "merged", "takeover", "buyout", "acqui-hire"]],
  ["hire", ["hired", "appointed", "named ceo", "named cto", "named cfo", "joins as", "executive", "leadership"]],
  ["reg", ["regulation", "regulatory", "compliance", "fda", "ema", "sec filing", "lawsuit", "antitrust"]],
  ["launch", ["launched", "released", "announced", "unveiled", "debut", "introduces", "rolls out", "goes live"]],
];

function detectSignalType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [signalType, keywords] of SIGNAL_TYPE_KEYWORDS) {
    for (const kw of keywords) {
      if (text.includes(kw)) return signalType;
    }
  }
  return "launch";
}

function extractSourceName(result: BraveNewsResult): string {
  if (result.meta_url?.hostname) {
    return result.meta_url.hostname.replace(/^www\./, "");
  }
  try {
    return new URL(result.url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

function parsePublishedAt(result: BraveNewsResult): Date {
  if (result.page_age) {
    try {
      return new Date(result.page_age);
    } catch {
      // fallthrough
    }
  }
  return new Date();
}

/**
 * Fetch signals for a scout via Brave Search API.
 *
 * If BRAVE_API_KEY is not set, returns a stub result with zero signals.
 */
export async function fetchSignals(
  prisma: PrismaClient,
  scoutId: string,
  braveApiKey?: string,
): Promise<FetchResult> {
  const scout = await prisma.scout.findUnique({ where: { id: scoutId } });
  if (!scout) {
    throw new Error(`Scout not found: ${scoutId}`);
  }

  const industry = scout.industryFocus;
  console.log(
    `[scout_signals] Fetching signals for scout "${scout.name}" (industry: ${industry})…`,
  );

  if (!braveApiKey) {
    console.log("[scout_signals] [Brave stub] BRAVE_API_KEY not set — returning empty result");
    return { scoutId, industry, total: 0, created: 0, skipped: 0 };
  }

  const query = `${industry} industry news`;
  const response = await fetch(
    `${BRAVE_API_URL}?q=${encodeURIComponent(query)}&count=20&freshness=pm`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": braveApiKey,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Brave Search API returned ${response.status}: ${body.slice(0, 200)}`,
    );
  }

  const data: BraveNewsResponse = await response.json();
  const results = data.results ?? data.web?.results ?? [];

  console.log(`[scout_signals] Brave returned ${results.length} news results`);

  let created = 0;
  let skipped = 0;

  for (const r of results) {
    if (!r.title || !r.url) continue;

    const url = r.url;
    const sourceName = extractSourceName(r);
    const signalType = detectSignalType(r.title, r.description);
    const publishedAt = parsePublishedAt(r);

    const existing = await prisma.signal.findFirst({
      where: { industry, url },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.signal.create({
      data: {
        industry,
        signalType,
        title: r.title.slice(0, 500),
        summary: r.description.slice(0, 2000),
        url,
        sourceName: sourceName.slice(0, 200),
        publishedAt,
        metadata: {
          brave_meta_url: r.meta_url,
          brave_age: r.age,
          extra_snippets: r.extra_snippets,
        },
      },
    });
    created++;
  }

  return { scoutId, industry, total: results.length, created, skipped };
}
