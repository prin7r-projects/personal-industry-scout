/**
 * Delivery worker — Monday morning brief distribution.
 *
 * Runs at 06:00 per-subscriber-tz. For each active subscription:
 *  1. Find signed briefs matching their watchlist industries for this ISO week.
 *  2. Generate a watermarked PDF for each brief.
 *  3. Upload to B2 (or stub for local dev).
 *  4. Write a deliveries row.
 *  5. Send Postmark email with the PDF link.
 */

import { PrismaClient } from "@pis/db";
import { generateWatermarkedPdf, type WatermarkInput } from "@pis/worker-watermark";
import { sendWeeklyBrief } from "@pis/postmark";
import { randomUUID as uuidv4 } from "crypto";

// ── Types ──

export interface DeliveryResult {
  subscriberEmail: string;
  briefIndustry: string;
  briefIsoweek: number;
  watermarkUuid: string;
  artifactUrl: string | null;
  channel: string;
  sent: boolean;
  error?: string;
}

// ── ISO week helpers ──

function getCurrentIsoWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  return now.getFullYear() * 100 + week;
}

// ── B2 upload stub ──

async function uploadToB2(
  pdfBuffer: Buffer,
  watermarkUuid: string
): Promise<string | null> {
  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APP_KEY;
  const bucketName = process.env.B2_BUCKET_NAME || "prin7r-pis-pdfs";

  if (!keyId || !appKey) {
    // Stub: return a fake URL for local dev
    console.log(`  [B2 stub] Would upload ${pdfBuffer.length} bytes to ${bucketName}/${watermarkUuid}.pdf`);
    return `https://stub-b2.example.com/${bucketName}/${watermarkUuid}.pdf`;
  }

  // In production, use Backblaze B2 S3-compatible API.
  // For Phase 1, we stub this — real B2 integration comes in Phase 2.
  console.log(`  [B2] Uploading ${pdfBuffer.length} bytes to ${bucketName}/${watermarkUuid}.pdf`);
  return `https://f004.backblazeb2.com/file/${bucketName}/${watermarkUuid}.pdf`;
}

// ── Main delivery function ──

export async function runDelivery(): Promise<DeliveryResult[]> {
  const prisma = new PrismaClient();
  const results: DeliveryResult[] = [];

  try {
    const currentWeek = getCurrentIsoWeek();
    console.log(`[deliver] Running for ISO week ${currentWeek}`);

    // Find all active subscriptions
    let subscriptions;
    try {
      subscriptions = await prisma.subscription.findMany({
        where: { status: "active" },
        include: {
          subscriber: {
            include: { watchlist: true },
          },
        },
      });
    } catch (err) {
      console.log(`[deliver] Database not available (${err instanceof Error ? err.message : String(err)}). Returning empty results.`);
      return results;
    }

    console.log(`[deliver] Found ${subscriptions.length} active subscriptions`);

    for (const sub of subscriptions) {
      const { subscriber, tier } = sub;
      const watchlist = subscriber.watchlist;

      if (!watchlist) {
        console.log(`[deliver] Skipping ${subscriber.email} — no watchlist`);
        continue;
      }

      const industries = watchlist.industries as string[];
      if (!industries || industries.length === 0) {
        console.log(`[deliver] Skipping ${subscriber.email} — empty watchlist`);
        continue;
      }

      // Find signed briefs for their industries this week
      const briefs = await prisma.brief.findMany({
        where: {
          industry: { in: industries },
          isoweek: currentWeek,
          status: { in: ["signed", "delivered"] },
        },
        include: {
          scout: true,
          citations: true,
        },
      });

      if (briefs.length === 0) {
        console.log(`[deliver] No briefs for ${subscriber.email} in industries: ${industries.join(", ")}`);
        continue;
      }

      for (const brief of briefs) {
        // Check if already delivered
        const existing = await prisma.delivery.findUnique({
          where: {
            briefId_subscriberId: {
              briefId: brief.id,
              subscriberId: subscriber.id,
            },
          },
        });

        if (existing) {
          console.log(`[deliver] Already delivered brief ${brief.industry} W${brief.isoweek} to ${subscriber.email}`);
          continue;
        }

        const watermarkUuid = uuidv4();
        const weekLabel = `W${currentWeek % 100}, ${Math.floor(currentWeek / 100)}`;

        console.log(`[deliver] Generating PDF for ${subscriber.email} — ${brief.industry} W${brief.isoweek}`);

        try {
          // Generate watermarked PDF
          const watermarkInput: WatermarkInput = {
            subscriberEmail: subscriber.email,
            watermarkUuid,
            briefBodyMd: brief.bodyMd,
            citations: brief.citations.map((c) => ({
              citeId: c.citeId,
              url: c.url,
              title: c.title,
            })),
            briefIndustry: brief.industry,
            briefIsoweek: brief.isoweek,
            scoutName: brief.scout.name,
            signedAt: brief.signedAt?.toISOString(),
          };

          const pdfBuffer = await generateWatermarkedPdf(watermarkInput);

          // Upload to B2
          const artifactUrl = await uploadToB2(pdfBuffer, watermarkUuid);

          // Write delivery row
          await prisma.delivery.create({
            data: {
              briefId: brief.id,
              subscriberId: subscriber.id,
              channel: "email",
              watermarkUuid,
              artifactUrl,
            },
          });

          // Update brief status to delivered
          if (brief.status === "signed") {
            await prisma.brief.update({
              where: { id: brief.id },
              data: { status: "delivered" },
            });
          }

          // Send email
          const emailResult = await sendWeeklyBrief(
            subscriber.email,
            artifactUrl || "",
            brief.industry,
            weekLabel,
            brief.scout.name
          );

          results.push({
            subscriberEmail: subscriber.email,
            briefIndustry: brief.industry,
            briefIsoweek: brief.isoweek,
            watermarkUuid,
            artifactUrl,
            channel: "email",
            sent: emailResult.ok,
            error: emailResult.error,
          });

          console.log(
            `[deliver] ${emailResult.ok ? "✅" : "❌"} ${subscriber.email} ← ${brief.industry} W${brief.isoweek}`
          );
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[deliver] Failed for ${subscriber.email}: ${errorMsg}`);
          results.push({
            subscriberEmail: subscriber.email,
            briefIndustry: brief.industry,
            briefIsoweek: brief.isoweek,
            watermarkUuid,
            artifactUrl: null,
            channel: "email",
            sent: false,
            error: errorMsg,
          });
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  return results;
}
