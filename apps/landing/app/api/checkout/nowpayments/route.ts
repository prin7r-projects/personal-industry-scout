/**
 * [SCOUT_NOWPAYMENTS_CHECKOUT] POST /api/checkout/nowpayments
 *
 * Body:    { plan: "operator" | "partner" | "concierge", email: string }
 * Returns: { invoice_url, invoice_id, plan, mode: "live" }
 *
 * Errors:  400 unknown plan / missing email, 503 missing env, 502 upstream NOWPayments error.
 *
 * Creates a pending subscriber so the subscriber ID can be encoded in the
 * NOWPayments order_id. The IPN handler looks up the subscriber by ID when
 * payment is confirmed and sends the intake-link email.
 *
 * The customer is redirected client-side to `invoice_url` for hosted USDT/USDC
 * checkout. We never log the API key.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MissingEnvError, appUrlFromRequest } from "@/lib/env";
import { PLANS, createNowpaymentsInvoice, isPlanId } from "@/lib/nowpayments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutBody = { plan?: string; email?: string };

export async function POST(request: Request) {
  let body: CheckoutBody = {};
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    body = {};
  }

  const planId = body.plan;
  if (!isPlanId(planId)) {
    return NextResponse.json(
      {
        error: "unknown_plan",
        message: `Unknown plan: ${String(planId)}. Allowed: ${Object.keys(PLANS).join(", ")}.`
      },
      { status: 400 }
    );
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: "missing_email", message: "An email address is required to subscribe." },
      { status: 400 }
    );
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  const plan = PLANS[planId];
  const baseUrl = appUrlFromRequest(request);

  // Create a pending subscriber so we have a stable ID for the order_id
  const subscriber = await prisma.subscriber.create({
    data: { email, name: `Pending — ${plan.name}` },
  });

  try {
    const invoice = await createNowpaymentsInvoice({ plan, baseUrl, subscriberId: subscriber.id });
    return NextResponse.json({
      mode: "live",
      plan: plan.id,
      monthly_usd: plan.monthlyUsd,
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url
    });
  } catch (error) {
    // Clean up the pending subscriber on invoice creation failure
    await prisma.subscriber.delete({ where: { id: subscriber.id } }).catch(() => {});
    if (error instanceof MissingEnvError) {
      return NextResponse.json(
        {
          error: "missing_env",
          missing: error.envName,
          message:
            "NOWPayments is not configured on this deployment yet. Email desk@personal-industry-scout.prin7r.com and we'll hand-wire your invoice."
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json({ error: "upstream_error", message }, { status: 502 });
  }
}
