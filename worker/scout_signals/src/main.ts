/**
 * Scout signals worker — CLI entrypoint.
 *
 * Usage:
 *   SCOUT_ID=<uuid> npx tsx src/main.ts
 *   npx tsx src/main.ts <scout_id>
 *
 * Env:
 *   BRAVE_API_KEY — Brave Search API subscription token (optional; stubbed if absent)
 */

import { PrismaClient } from "@pis/db";
import { fetchSignals } from "./fetch.js";

async function main() {
  const scoutId = process.argv[2] || process.env.SCOUT_ID;
  if (!scoutId) {
    console.error("Usage: tsx src/main.ts <scout_id>");
    console.error("   or: SCOUT_ID=<scout_id> tsx src/main.ts");
    process.exit(2);
  }

  const braveApiKey = process.env.BRAVE_API_KEY;

  const prisma = new PrismaClient();

  try {
    const result = await fetchSignals(prisma, scoutId, braveApiKey);
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

main();
