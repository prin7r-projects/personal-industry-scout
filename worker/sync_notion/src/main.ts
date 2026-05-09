/**
 * Notion → Postgres sync entrypoint.
 *
 * Usage: NOTION_TOKEN=... NOTION_BRIEFS_DATABASE_ID=... npx tsx src/main.ts
 * Cron:  0 3 * * *  (runs daily at 03:00 UTC)
 */
import { PrismaClient } from "@pis/db";
import { fetchBriefsFromNotion, syncBriefsToPostgres } from "./sync.js";

async function main() {
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_BRIEFS_DATABASE_ID;

  if (!notionToken || !databaseId) {
    console.error("NOTION_TOKEN and NOTION_BRIEFS_DATABASE_ID must be set");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log("[sync_notion] Fetching briefs from Notion…");
    const briefs = await fetchBriefsFromNotion(notionToken, databaseId);
    console.log(`[sync_notion] Fetched ${briefs.length} briefs`);

    console.log("[sync_notion] Syncing to Postgres…");
    const result = await syncBriefsToPostgres(prisma, briefs);
    console.log(
      `[sync_notion] Done — ${result.created} created, ${result.updated} updated, ${result.citations} citations`
    );
  } catch (err) {
    console.error("[sync_notion] Sync failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
