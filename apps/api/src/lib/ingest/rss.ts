import { XMLParser, XMLValidator } from "fast-xml-parser";
import type { ParsedSource } from "./types.js";

function forceArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function readText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "_" in value) return readText((value as Record<string, unknown>)._);
  if (typeof value === "object" && "#text" in value) return readText((value as Record<string, unknown>)["#text"]);
  return undefined;
}

function parseRssItem(item: Record<string, unknown>): ParsedSource {
  return {
    url: readText(item.link) ?? "",
    title: readText(item.title),
    description: readText(item.description),
    content: readText(item["content:encoded"]),
    author: readText(item.author ?? item["dc:creator"]),
    publishedAt: readText(item.pubDate ?? item.published),
    categories: item.category != null
      ? forceArray(item.category).flatMap((category) => {
          const text = readText(category);
          return text ? [text] : [];
        })
      : undefined,
    guid: readText(item.guid),
    sourceType: "rss",
    sourceUrl: "",
  };
}

function parseAtomEntry(entry: Record<string, unknown>): ParsedSource {
  const link = forceArray(entry.link).find((candidate) => {
    if (typeof candidate === "string") return true;
    return (candidate as Record<string, unknown>)["@_rel"] !== "self";
  });
  const authorObj = entry.author as Record<string, unknown> | undefined;

  return {
    url: typeof link === "string" ? link : readText((link as Record<string, unknown> | undefined)?.["@_href"]) ?? "",
    title: readText(entry.title),
    description: readText(entry.summary),
    content: readText(entry.content),
    author: readText(authorObj?.name),
    publishedAt: readText(entry.published),
    modifiedAt: readText(entry.updated),
    categories: entry.category != null
      ? forceArray(entry.category).flatMap((category) => {
          const text = typeof category === "string"
            ? category
            : readText((category as Record<string, unknown>)["@_term"]);
          return text ? [text] : [];
        })
      : undefined,
    guid: readText(entry.id),
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
  if (xml.trim() === "") return [];

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Invalid RSS XML: ${validation.err.msg}`);
  }

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
