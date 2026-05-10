/**
 * [SCOUT_NOWPAYMENTS_IPN] POST /api/webhooks/nowpayments
 *
 * NOWPayments delivers payment status updates here. JSON body, with the
 * `x-nowpayments-sig` header carrying the HMAC-SHA512 of the alphabetically
 * sorted JSON.
 *
 *   503 if NOWPAYMENTS_IPN_SECRET unset (operator gap, not auth)
 *   400 invalid JSON
 *   401 signature invalid
 *   200 + { ok, paid, order_id, status } on a verified payload
 *
 * On confirmed payments, activates the pending subscriber (created at checkout),
 * creates Subscription + Order records, generates an intake token, and sends
 * the intake-link email via Postmark.
 * Idempotent — duplicate invoice_ids are silently acknowledged.
 */

import { NextResponse } from "next/server";
import { optionalEnv } from "@/lib/env";
import { verifyNowpaymentsIpn, isPlanId, PLANS, extractSubscriberId } from "@/lib/nowpayments";
import { prisma } from "@/lib/prisma";
import { generateIntakeToken } from "@/lib/intake-token";
import { sendIntakeLink } from "@/lib/postmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = optionalEnv("NOWPAYMENTS_IPN_SECRET");
  if (!secret) {
    return NextResponse.json(
      {
        error: "missing_env",
        missing: "NOWPAYMENTS_IPN_SECRET",
        message: "Webhook handler is not configured."
      },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "invalid_payload", message: "Body was not valid JSON." },
      { status: 400 }
    );
  }

  const signature = request.headers.get("x-nowpayments-sig");
  const verified = verifyNowpaymentsIpn(payload, signature, secret);
  if (!verified) {
    return NextResponse.json({ error: "signature_invalid" }, { status: 401 });
  }

  const status = stringValue(payload.payment_status) ?? "";
  const paid = ["finished", "confirmed"].includes(status.toLowerCase());
  const orderId =
    stringValue(payload.order_id) ?? stringValue(payload.payment_id) ?? "nowpayments_unknown";
  const invoiceId = stringValue(payload.invoice_id) ?? orderId;

  if (paid) {
    try {
      await persistOrder(payload, orderId, invoiceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      console.error(`[SCOUT_NOWPAYMENTS_IPN] persist failed order_id=${orderId}: ${message}`);
      return NextResponse.json(
        { error: "persist_failed", message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    verified: true,
    paid,
    order_id: orderId,
    status
  });
}

async function persistOrder(
  payload: Record<string, unknown>,
  orderId: string,
  invoiceId: string
) {
  const existing = await prisma.order.findUnique({ where: { invoiceId } });
  if (existing) {
    console.log(`[SCOUT_NOWPAYMENTS_IPN] duplicate invoice_id=${invoiceId}, skipping`);
    return;
  }

  const planId = extractPlanId(orderId);
  const plan = isPlanId(planId) ? PLANS[planId] : PLANS.operator;
  const amountCents = Math.round(parseFloat(stringValue(payload.price_amount) ?? "0") * 100);

  // Try to find the pending subscriber from checkout
  const subscriberId = extractSubscriberId(orderId);
  let subscriber = subscriberId
    ? await prisma.subscriber.findUnique({ where: { id: subscriberId } })
    : null;

  if (!subscriber) {
    // Fallback: create a subscriber (legacy orders without checkout-created subscriber)
    subscriber = await prisma.subscriber.create({
      data: {
        email: `pending-${invoiceId}@pis.pending`,
        name: `Pending — ${plan.name}`,
      },
    });
    console.log(`[SCOUT_NOWPAYMENTS_IPN] created fallback subscriber=${subscriber.id} (no checkout subscriber found)`);
  } else {
    console.log(`[SCOUT_NOWPAYMENTS_IPN] found existing subscriber=${subscriber.id} email=${subscriber.email}`);
  }

  const subscription = await prisma.subscription.create({
    data: {
      subscriberId: subscriber.id,
      tier: plan.id,
      status: "active",
    },
  });

  await prisma.order.create({
    data: {
      subscriptionId: subscription.id,
      invoiceId,
      amountCents,
    },
  });

  console.log(
    `[SCOUT_NOWPAYMENTS_IPN] created subscription=${subscription.id} plan=${plan.id} amountCents=${amountCents}`
  );

  // Generate intake token and send email (skip for fallback subscribers without real email)
  if (subscriber.email && !subscriber.email.startsWith("pending-")) {
    try {
      const intakeToken = generateIntakeToken(subscriber.id);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://personal-industry-scout.prin7r.com";
      const intakeUrl = `${baseUrl}/intake/${intakeToken}`;

      const emailResult = await sendIntakeLink(subscriber.email, intakeUrl);
      console.log(
        `[SCOUT_NOWPAYMENTS_IPN] intake email ${emailResult.ok ? "sent" : "failed"} to ${subscriber.email}: ${emailResult.error || emailResult.messageId}`
      );
    } catch (err) {
      console.error(`[SCOUT_NOWPAYMENTS_IPN] intake email error for ${subscriber.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

function extractPlanId(orderId: string): string {
  const match = orderId.match(/^scout_(operator|partner|concierge)_/);
  return match ? match[1] : "operator";
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}
