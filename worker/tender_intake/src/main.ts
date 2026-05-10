/**
 * Tender intake entrypoint — pulls open tenders from a configurable RSS/JSON
 * source and persists rows to the Signal table.
 *
 * Usage: TENDER_SOURCE_URL=https://... [TENDER_INDUSTRY=general] npx tsx src/main.ts
 * Cron: 0 0,6,12,18 * * * (every 6 hours)
 */
import type { Prisma } from "@pis/db";
import { PrismaClient } from "@pis/db";
import { fetchTenders } from "./fetch.js";

async function main() {
  const sourceUrl = process.env.TENDER_SOURCE_URL;
  const industry = process.env.TENDER_INDUSTRY || "general";

  if (!sourceUrl) {
    console.error("TENDER_SOURCE_URL must be set");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    let sourceName: string;
    try {
      sourceName = new URL(sourceUrl).hostname;
    } catch {
      sourceName = sourceUrl;
    }

    console.log(`[tender_intake] Fetching tenders from ${sourceUrl}…`);
    const items = await fetchTenders(sourceUrl);
    console.log(`[tender_intake] Fetched ${items.length} items`);

    let created = 0;
    let skipped = 0;

    for (const item of items) {
      if (item.url) {
        const existing = await prisma.signal.findFirst({ where: { url: item.url } });
        if (existing) {
          skipped++;
          continue;
        }
      }

      await prisma.signal.create({
        data: {
          industry,
          signalType: "tender",
          title: item.title,
          summary: item.summary,
          url: item.url,
          sourceName,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
          metadata: item.metadata as Prisma.InputJsonValue,
        },
      });
      created++;
    }

    console.log(`[tender_intake] Done — ${created} created, ${skipped} skipped`);
  } catch (err) {
    console.error("[tender_intake] Intake failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
