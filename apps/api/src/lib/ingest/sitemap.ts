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

function parseUrlEntry(entry: Record<string, unknown>, sitemapUrl: string): ParsedSource | undefined {
  const url = readText(entry.loc);
  if (!url) return undefined;

  return {
    url,
    modifiedAt: readText(entry.lastmod),
    sourceType: "sitemap",
    sourceUrl: sitemapUrl,
  };
}

export async function fetchSitemap(sitemapUrl: string): Promise<ParsedSource[]> {
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  if (xml.trim() === "") return [];

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Invalid sitemap XML: ${validation.err.msg}`);
  }

  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);

  if (doc.urlset) {
    const urlset = doc.urlset as Record<string, unknown>;
    return forceArray(urlset.url).flatMap((entry) => {
      const parsed = parseUrlEntry(entry as Record<string, unknown>, sitemapUrl);
      return parsed ? [parsed] : [];
    });
  }

  if (doc.sitemapindex) {
    const sitemapIndex = doc.sitemapindex as Record<string, unknown>;
    return forceArray(sitemapIndex.sitemap).flatMap((entry) => {
      const parsed = parseUrlEntry(entry as Record<string, unknown>, sitemapUrl);
      return parsed ? [{ ...parsed, sourceType: "sitemap-index" }] : [];
    });
  }

  throw new Error("Unsupported sitemap format: expected <urlset> or <sitemapindex>");
}
