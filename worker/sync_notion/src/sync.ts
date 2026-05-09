import { Client } from "@notionhq/client";
import { PrismaClient } from "@pis/db";

export interface NotionBriefRow {
  id: string;
  industry: string;
  isoweek: number;
  scoutName: string;
  bodyMd: string;
  citations: Array<{
    citeId: string;
    url: string;
    title: string;
  }>;
}

/**
 * Fetch briefs from a Notion database.
 *
 * Expects a Notion DB with properties:
 *  - Industry (title or rich_text)
 *  - ISO Week (number)
 *  - Scout Name (rich_text)
 *  - Body (rich_text or a child page we read)
 *  - Status (select: draft | verifying | signed | delivered)
 *  - Citations (relation to a Citations DB, or a jsonb-like rich_text blob)
 *
 * In Phase 1 this reads the Notion DB directly; in Phase 2 it migrates to Postgres-native.
 */
export async function fetchBriefsFromNotion(
  notionToken: string,
  databaseId: string
): Promise<NotionBriefRow[]> {
  const notion = new Client({ auth: notionToken });

  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Status",
      select: {
        does_not_equal: "delivered",
      },
    },
    sorts: [{ property: "ISO Week", direction: "ascending" }],
  });

  const briefs: NotionBriefRow[] = [];

  for (const page of response.results) {
    // Type-guard: we only process page objects
    if (!("properties" in page)) continue;
    const props = page.properties as Record<string, unknown>;

    // Extract properties with safe fallbacks
    const industry = extractRichText(props, "Industry") || "unknown";
    const isoweek = extractNumber(props, "ISO Week") || 0;
    const scoutName = extractRichText(props, "Scout Name") || "Unknown Scout";
    const bodyMd = extractRichText(props, "Body") || "";
    const status = extractSelect(props, "Status") || "draft";

    // Citations: try relation first, fall back to rich_text JSON blob
    let citations: Array<{ citeId: string; url: string; title: string }> = [];
    const citeProp = props["Citations"];
    if (citeProp && typeof citeProp === "object") {
      if ("relation" in citeProp && Array.isArray(citeProp.relation)) {
        // Relations — would need a second query to resolve; for now use empty
        citations = [];
      } else if ("rich_text" in citeProp && Array.isArray(citeProp.rich_text)) {
        // Parse JSON blob from rich_text
        try {
          const text = (citeProp.rich_text as Array<{ plain_text: string }>)
            .map((t) => t.plain_text)
            .join("");
          if (text) citations = JSON.parse(text);
        } catch {
          // ignore parse errors
        }
      }
    }

    briefs.push({
      id: page.id,
      industry,
      isoweek,
      scoutName,
      bodyMd,
      citations,
    });
  }

  return briefs;
}

/**
 * Upsert briefs from Notion into Postgres.
 * For each brief: find-or-create the scout, upsert the brief, upsert citations.
 */
export async function syncBriefsToPostgres(
  prisma: PrismaClient,
  briefs: NotionBriefRow[]
): Promise<{ created: number; updated: number; citations: number }> {
  let created = 0;
  let updated = 0;
  let citationCount = 0;

  for (const nb of briefs) {
    // Find or create scout by name + industry
    const scout = await prisma.scout.upsert({
      where: { id: `notion-${nb.scoutName}-${nb.industry}`.replace(/\s+/g, "-").toLowerCase() },
      update: { name: nb.scoutName, industryFocus: nb.industry },
      create: {
        id: `notion-${nb.scoutName}-${nb.industry}`.replace(/\s+/g, "-").toLowerCase(),
        name: nb.scoutName,
        industryFocus: nb.industry,
      },
    });

    // Upsert brief
    const existing = await prisma.brief.findFirst({
      where: { industry: nb.industry, isoweek: nb.isoweek },
    });

    const brief = await prisma.brief.upsert({
      where: {
        id: existing?.id || `notion-${nb.id}`,
      },
      update: {
        bodyMd: nb.bodyMd,
        scoutId: scout.id,
      },
      create: {
        id: `notion-${nb.id}`,
        industry: nb.industry,
        isoweek: nb.isoweek,
        scoutId: scout.id,
        status: "draft",
        bodyMd: nb.bodyMd,
      },
    });

    if (existing) updated++;
    else created++;

    // Upsert citations
    for (const cite of nb.citations) {
      await prisma.citation.upsert({
        where: { id: cite.citeId },
        update: {
          url: cite.url,
          title: cite.title,
          briefId: brief.id,
        },
        create: {
          id: cite.citeId,
          briefId: brief.id,
          citeId: cite.citeId,
          url: cite.url,
          title: cite.title,
        },
      });
      citationCount++;
    }
  }

  return { created, updated, citations: citationCount };
}

// ── helpers ──

function extractRichText(props: Record<string, unknown>, name: string): string | null {
  const prop = props[name];
  if (!prop || typeof prop !== "object") return null;

  if ("title" in prop && Array.isArray(prop.title)) {
    return (prop.title as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  if ("rich_text" in prop && Array.isArray(prop.rich_text)) {
    return (prop.rich_text as Array<{ plain_text: string }>)
      .map((t) => t.plain_text)
      .join("");
  }
  return null;
}

function extractNumber(props: Record<string, unknown>, name: string): number | null {
  const prop = props[name];
  if (!prop || typeof prop !== "object") return null;
  if ("number" in prop) return (prop as { number: number | null }).number;
  return null;
}

function extractSelect(props: Record<string, unknown>, name: string): string | null {
  const prop = props[name];
  if (!prop || typeof prop !== "object") return null;
  if ("select" in prop) {
    const select = (prop as { select: { name: string } | null }).select;
    return select?.name ?? null;
  }
  return null;
}
