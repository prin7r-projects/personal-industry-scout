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
 * Order persistence is intentionally a console.log audit trail in Wave 2.
 * apps/app/ will replace it with a DB write when subscriptions ship.
 */

import { NextResponse } from "next/server";
import { optionalEnv } from "@/lib/env";
import { verifyNowpaymentsIpn } from "@/lib/nowpayments";

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

  // Stub — when apps/app ships, this becomes a DB write.
  console.log(
    `[SCOUT_NOWPAYMENTS_IPN] verified=true order_id=${orderId} status=${status} paid=${paid}`
  );

  return NextResponse.json({
    ok: true,
    verified: true,
    paid,
    order_id: orderId,
    status
  });
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return undefined;
}
