/**
 * Scout signals worker — CLI entrypoint.
 *
 * Usage:
 *   npx tsx src/main.ts --all                              # iterate all active scouts
 *   npx tsx src/main.ts <scout_id>                         # single scout
 *   SCOUT_ID=<scout_id> npx tsx src/main.ts                # single scout via env
 *
 * Cron: 0 2 * * *  (daily at 02:00 UTC, uses --all to cover every active scout)
 *
 * Env:
 *   BRAVE_API_KEY — Brave Search API subscription token (optional; stubbed if absent)
 */

import { PrismaClient } from "@pis/db";
import { fetchSignals } from "./fetch.js";
import type { FetchResult } from "./fetch.js";

export async function fetchSignalsForAllScouts(
  prisma: PrismaClient,
  braveApiKey?: string,
): Promise<FetchResult[]> {
  const scouts = await prisma.scout.findMany({
    orderBy: { name: "asc" },
  });

  if (scouts.length === 0) {
    console.log("[scout_signals] No active scouts found");
    return [];
  }

  console.log(`[scout_signals] Processing ${scouts.length} active scout(s)`);
  const results: FetchResult[] = [];

  for (const scout of scouts) {
    try {
      const result = await fetchSignals(prisma, scout.id, braveApiKey);
      console.log(
        `[scout_signals] ${scout.name}: ${result.total} fetched, ${result.created} created, ${result.skipped} skipped`,
      );
      results.push(result);
    } catch (err) {
      console.error(
        `[scout_signals] Failed for ${scout.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return results;
}

async function main() {
  const arg = process.argv[2];
  const scoutId = arg && arg !== "--all" ? arg : process.env.SCOUT_ID;
  const allMode = arg === "--all";

  if (!allMode && !scoutId) {
    console.error("Usage: tsx src/main.ts [--all | <scout_id>]");
    console.error("   or: SCOUT_ID=<scout_id> tsx src/main.ts");
    process.exit(2);
  }

  const braveApiKey = process.env.BRAVE_API_KEY;
  const prisma = new PrismaClient();

  try {
    if (allMode) {
      const results = await fetchSignalsForAllScouts(prisma, braveApiKey);
      const totalFetched = results.reduce((s, r) => s + r.total, 0);
      const totalCreated = results.reduce((s, r) => s + r.created, 0);
      const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
      console.log(
        `[scout_signals] All done — ${totalFetched} fetched, ${totalCreated} created, ${totalSkipped} skipped across ${results.length} scout(s)`,
      );
      process.exit(0);
    }

    const result = await fetchSignals(prisma, scoutId!, braveApiKey);
    console.log(
      `[scout_signals] Done — ${result.total} fetched, ${result.created} created, ${result.skipped} skipped`,
    );
  } catch (err) {
    console.error("[scout_signals] Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run main when executed directly (not when imported for testing)
if (process.argv[1]?.includes("main")) {
  main();
}
