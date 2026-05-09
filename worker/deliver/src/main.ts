/**
 * Delivery worker — CLI entrypoint.
 *
 * Usage: npx tsx src/main.ts
 * Cron: 0 6 * * 1 (Monday 06:00 UTC — per-subscriber-tz batching TBD in Phase 2)
 */
import { runDelivery } from "./deliver.js";

async function main() {
  console.log("[deliver] Starting Monday delivery run…");
  const results = await runDelivery();
  console.log(`[deliver] Complete — ${results.length} deliveries attempted`);

  const succeeded = results.filter((r) => r.sent).length;
  const failed = results.filter((r) => !r.sent).length;

  console.log(`[deliver] ${succeeded} sent, ${failed} failed`);

  if (failed > 0) {
    console.log("[deliver] Failures:");
    for (const r of results) {
      if (!r.sent) {
        console.log(`  - ${r.subscriberEmail}: ${r.error}`);
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
