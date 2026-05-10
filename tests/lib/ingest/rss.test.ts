import * as assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchRssFeed } from "../../../apps/api/src/lib/ingest/rss.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(body: string, init: ResponseInit = {}) {
  globalThis.fetch = async () => new Response(body, { status: 200, ...init });
}

test("fetchRssFeed parses RSS items into ParsedSource entries", async () => {
  mockFetch(`<?xml version="1.0"?>
    <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <channel>
        <title>Fintech Wire</title>
        <item>
          <title>Payments startup raises seed round</title>
          <link>https://example.com/payments-seed</link>
          <description>Funding news</description>
          <content:encoded><![CDATA[Full article body]]></content:encoded>
          <dc:creator>Desk Reporter</dc:creator>
          <pubDate>Sat, 09 May 2026 12:00:00 GMT</pubDate>
          <category>funding</category>
          <category>payments</category>
          <guid isPermaLink="false">story-1</guid>
        </item>
      </channel>
    </rss>`);

  const parsed = await fetchRssFeed("https://feeds.example.com/rss.xml");

  assert.deepEqual(parsed, [
    {
      url: "https://example.com/payments-seed",
      title: "Payments startup raises seed round",
      description: "Funding news",
      content: "Full article body",
      author: "Desk Reporter",
      publishedAt: "Sat, 09 May 2026 12:00:00 GMT",
      categories: ["funding", "payments"],
      guid: "story-1",
      sourceType: "rss",
      sourceUrl: "https://feeds.example.com/rss.xml",
    },
  ]);
});

test("fetchRssFeed returns an empty list for empty input", async () => {
  mockFetch("   ");

  await assert.doesNotReject(async () => {
    assert.deepEqual(await fetchRssFeed("https://feeds.example.com/rss.xml"), []);
  });
});

test("fetchRssFeed rejects malformed XML", async () => {
  mockFetch("<rss><channel><item></channel></rss>");

  await assert.rejects(
    fetchRssFeed("https://feeds.example.com/rss.xml"),
    /Invalid RSS XML/,
  );
});
