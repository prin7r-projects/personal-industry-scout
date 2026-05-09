/**
 * Watermark worker — CLI entrypoint for ad-hoc PDF generation.
 *
 * Usage: npx tsx src/main.ts
 * Expects JSON on stdin: { subscriberEmail, watermarkUuid, briefBodyMd, citations[], ... }
 */
import { generateWatermarkedPdf } from "./watermark.js";

async function main() {
  // Read JSON from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  const input = JSON.parse(Buffer.concat(chunks).toString());

  const pdf = await generateWatermarkedPdf(input);
  process.stdout.write(pdf);
}

main().catch((err) => {
  console.error("Watermark generation failed:", err);
  process.exit(1);
});
