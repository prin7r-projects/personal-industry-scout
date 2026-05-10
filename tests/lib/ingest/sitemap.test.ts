import * as assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchSitemap } from "../../../apps/api/src/lib/ingest/sitemap.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(body: string, init: ResponseInit = {}) {
  globalThis.fetch = async () => new Response(body, { status: 200, ...init });
}

test("fetchSitemap parses urlset entries into ParsedSource entries", async () => {
  mockFetch(`<?xml version="1.0"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://example.com/a</loc>
        <lastmod>2026-05-09</lastmod>
      </url>
      <url>
        <loc>https://example.com/b</loc>
      </url>
    </urlset>`);

  const parsed = await fetchSitemap("https://example.com/sitemap.xml");

  assert.deepEqual(parsed, [
    {
      url: "https://example.com/a",
      modifiedAt: "2026-05-09",
      sourceType: "sitemap",
      sourceUrl: "https://example.com/sitemap.xml",
    },
    {
      url: "https://example.com/b",
      modifiedAt: undefined,
      sourceType: "sitemap",
      sourceUrl: "https://example.com/sitemap.xml",
    },
  ]);
});

test("fetchSitemap returns an empty list for empty input", async () => {
  mockFetch("\n\t");

  await assert.doesNotReject(async () => {
    assert.deepEqual(await fetchSitemap("https://example.com/sitemap.xml"), []);
  });
});

test("fetchSitemap rejects malformed XML", async () => {
  mockFetch("<urlset><url><loc>https://example.com</urlset>");

  await assert.rejects(
    fetchSitemap("https://example.com/sitemap.xml"),
    /Invalid sitemap XML/,
  );
});
