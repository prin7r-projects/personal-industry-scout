import Parser from "rss-parser";

const rssParser = new Parser();

export interface RawTenderItem {
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Detect whether a URL returns RSS/Atom (XML) or JSON.
 * Fetches the URL and inspects the Content-Type header.
 */
async function detectFormat(
  url: string
): Promise<"rss" | "json"> {
  const res = await fetch(url, {
    headers: { Accept: "application/rss+xml, application/json, text/xml, */*" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("xml") || contentType.includes("rss")) {
    return "rss";
  }
  return "json";
}

/**
 * Parse an RSS/Atom feed into RawTenderItem[].
 */
async function fetchRSS(url: string): Promise<RawTenderItem[]> {
  const feed = await rssParser.parseURL(url);
  return feed.items.map((item) => ({
    title: item.title || "Untitled",
    summary: item.contentSnippet || item.content || item.summary || "",
    url: item.link || "",
    publishedAt: item.pubDate || item.isoDate || "",
    metadata: { ...item },
  }));
}

/**
 * Parse a JSON endpoint into RawTenderItem[].
 *
 * Supports two formats:
 * 1. JSON Feed (https://www.jsonfeed.org) — { items: [...] }
 * 2. Generic JSON array of tender-like objects.
 *
 * Fields are mapped generously: title, description/summary, link/url, pubDate/publishedAt.
 */
async function fetchJSON(url: string): Promise<RawTenderItem[]> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  const data = await res.json();

  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).items)) {
    items = (data as Record<string, unknown>).items as unknown[];
  } else {
    throw new Error(`Unrecognized JSON structure from ${url}`);
  }

  return items.map((item: unknown, i: number): RawTenderItem => {
    const obj = item as Record<string, unknown> | undefined;
    if (!obj || typeof obj !== "object") {
      return {
        title: `Item ${i + 1}`,
        summary: String(item),
        url: "",
        publishedAt: "",
        metadata: { raw: item },
      };
    }

    const title = String(obj.title || obj.name || obj.subject || `Item ${i + 1}`);
    const summary = String(obj.description || obj.summary || obj.body || obj.content || "");
    const itemUrl = String(obj.link || obj.url || obj.href || "");
    const publishedAt = String(obj.pubDate || obj.publishedAt || obj.date || obj.published || "");
    const metadata = { ...obj } as Record<string, unknown>;

    return { title, summary, url: itemUrl, publishedAt, metadata };
  });
}

/**
 * Fetch tenders from a source URL. Auto-detects RSS vs JSON format.
 */
export async function fetchTenders(url: string): Promise<RawTenderItem[]> {
  const format = await detectFormat(url);
  if (format === "rss") {
    return fetchRSS(url);
  }
  return fetchJSON(url);
}
