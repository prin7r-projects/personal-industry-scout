import { XMLParser } from "fast-xml-parser";
import type { ParsedSource } from "./types.js";

function forceArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function parseRssItem(item: Record<string, unknown>): ParsedSource {
  return {
    url: String(item.link ?? ""),
    title: item.title != null ? String(item.title) : undefined,
    description: item.description != null ? String(item.description) : undefined,
    content: item["content:encoded"] != null ? String(item["content:encoded"]) : undefined,
    author: item.author != null ? String(item.author) : undefined,
    publishedAt: item.pubDate != null ? String(item.pubDate) : undefined,
    categories: item.category != null
      ? forceArray(item.category).map((c) => (typeof c === "string" ? c : String((c as Record<string, unknown>)._ ?? c)))
      : undefined,
    guid: item.guid != null
      ? typeof item.guid === "string"
        ? item.guid
        : String((item.guid as Record<string, unknown>)._ ?? item.guid)
      : undefined,
    sourceType: "rss",
    sourceUrl: "",
  };
}

function parseAtomEntry(entry: Record<string, unknown>): ParsedSource {
  const link = forceArray(entry.link).find(
    (l) => (l as Record<string, unknown>)["@_rel"] !== "self"
  ) as Record<string, unknown> | undefined;
  const authorObj = entry.author as Record<string, unknown> | undefined;

  return {
    url: link != null ? String(link["@_href"] ?? "") : "",
    title: entry.title != null
      ? typeof entry.title === "string"
        ? entry.title
        : String((entry.title as Record<string, unknown>)._ ?? entry.title)
      : undefined,
    description: entry.summary != null
      ? typeof entry.summary === "string"
        ? entry.summary
        : String((entry.summary as Record<string, unknown>)._ ?? entry.summary)
      : undefined,
    content: entry.content != null
      ? typeof entry.content === "string"
        ? entry.content
        : String((entry.content as Record<string, unknown>)._ ?? entry.content)
      : undefined,
    author: authorObj?.name != null ? String(authorObj.name) : undefined,
    publishedAt: entry.published != null ? String(entry.published) : undefined,
    modifiedAt: entry.updated != null ? String(entry.updated) : undefined,
    categories: entry.category != null
      ? forceArray(entry.category).map((c) =>
          typeof c === "string" ? c : String((c as Record<string, unknown>)["@_term"] ?? c)
        )
      : undefined,
    guid: entry.id != null ? String(entry.id) : undefined,
    sourceType: "rss",
    sourceUrl: "",
  };
}

export async function fetchRssFeed(feedUrl: string): Promise<ParsedSource[]> {
  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);

  if (doc.rss?.channel) {
    const channel = doc.rss.channel as Record<string, unknown>;
    const items = forceArray(channel.item);
    return items.map((item) => {
      const parsed = parseRssItem(item as Record<string, unknown>);
      parsed.sourceUrl = feedUrl;
      return parsed;
    });
  }

  if (doc.feed && (doc.feed as Record<string, unknown>).entry) {
    const feed = doc.feed as Record<string, unknown>;
    const entries = forceArray(feed.entry);
    return entries.map((entry) => {
      const parsed = parseAtomEntry(entry as Record<string, unknown>);
      parsed.sourceUrl = feedUrl;
      return parsed;
    });
  }

  throw new Error("Unsupported feed format: expected RSS <channel> or Atom <feed>");
}
