/**
 * [SCOUT_NOWPAYMENTS] Server-side helpers for the NOWPayments hosted invoice.
 *
 * Three subscription tiers map to NOWPayments hosted invoices. The customer
 * pays the first month upfront via crypto (USDT/USDC) on the hosted invoice
 * page. Recurring billing is collected manually from the subscription
 * dashboard until apps/app/ ships.
 *
 * `verifyNowpaymentsIpn` is the canonical HMAC-SHA512 verifier copied from
 * /Users/keer/projects/prin7r/payments-prototypes/src/lib/signatures.ts.
 * NOWPayments signs the alphabetically-sorted JSON body with the IPN secret.
 * Never trust an unverified payload.
 */

import crypto from "node:crypto";
import { MissingEnvError, optionalEnv } from "@/lib/env";

export type PlanId = "operator" | "partner" | "concierge";

export type Plan = {
  id: PlanId;
  name: string;
  monthlyUsd: number;
  description: string;
  // The "first month" charged on the hosted invoice (= monthlyUsd).
  // Future-proofed for prepaid annual offers.
  invoiceUsd: number;
};

export const PLANS: Record<PlanId, Plan> = {
  operator: {
    id: "operator",
    name: "Scout — Operator subscription",
    monthlyUsd: 95,
    invoiceUsd: 95,
    description:
      "Operator monthly. One industry brief, every Monday 06:00 your time. 5-minute read. Top movements, deals, hires, releases — distilled by an analyst, not a feed. Two questions answered ad-hoc per month."
  },
  partner: {
    id: "partner",
    name: "Scout — Partner subscription",
    monthlyUsd: 245,
    invoiceUsd: 245,
    description:
      "Partner monthly. Two adjacent industry briefs every Monday + Thursday alert digest. 30-minute onboarding to lock your accounts/people watchlist. Eight questions answered ad-hoc per month, escalation to a named scout for any urgent signal."
  },
  concierge: {
    id: "concierge",
    name: "Scout — Concierge subscription",
    monthlyUsd: 695,
    invoiceUsd: 695,
    description:
      "Concierge monthly. Up to four industry briefs, daily signal alerts, named scout on retainer for a 30-minute call any week, ad-hoc briefs on any deal/person/account, and a private Telegram thread for in-flight asks. White-glove."
  }
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

export type CreateInvoiceInput = {
  plan: Plan;
  baseUrl: string;
};

export type NowpaymentsInvoice = {
  id: string;
  invoice_url: string;
  raw: Record<string, unknown>;
};

/**
 * POST https://api.nowpayments.io/v1/invoice — hosted USDT/USDC checkout.
 * Returns the invoice id + redirect URL. Never logs the API key.
 */
export async function createNowpaymentsInvoice(
  input: CreateInvoiceInput
): Promise<NowpaymentsInvoice> {
  const apiKey = optionalEnv("NOWPAYMENTS_API_KEY");
  if (!apiKey) throw new MissingEnvError("NOWPAYMENTS_API_KEY");

  const sandbox = (optionalEnv("NOWPAYMENTS_SANDBOX") ?? "false").toLowerCase() === "true";
  const apiBase = sandbox ? "https://api-sandbox.nowpayments.io" : "https://api.nowpayments.io";

  const orderId = `scout_${input.plan.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const body = {
    price_amount: input.plan.invoiceUsd,
    price_currency: "usd",
    order_id: orderId,
    order_description: input.plan.description,
    ipn_callback_url: `${input.baseUrl}/api/webhooks/nowpayments`,
    success_url: `${input.baseUrl}/?order=${orderId}&status=paid#hero`,
    cancel_url: `${input.baseUrl}/?order=${orderId}&status=cancelled#hero`,
    is_fee_paid_by_user: false,
    is_fixed_rate: false
  };

  const response = await fetch(`${apiBase}/v1/invoice`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const text = await response.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    parsed = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`NOWPayments returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  const invoiceUrl = typeof parsed.invoice_url === "string" ? parsed.invoice_url : "";
  const invoiceId =
    typeof parsed.id === "string" || typeof parsed.id === "number" ? String(parsed.id) : orderId;

  if (!invoiceUrl) {
    throw new Error("NOWPayments response did not include invoice_url");
  }

  return {
    id: invoiceId,
    invoice_url: invoiceUrl,
    raw: parsed
  };
}

/* ------------------------------------------------------------------ */
/* HMAC-SHA512 IPN verification — verbatim from payments-prototypes.   */
/* ------------------------------------------------------------------ */

function timingSafeEqualHex(left: string, right: string): boolean {
  const a = left.trim().toLowerCase();
  const b = right.trim().toLowerCase();
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObject((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }
  return value;
}

export function verifyNowpaymentsIpn(
  payload: unknown,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const sorted = JSON.stringify(sortObject(payload));
  const expected = crypto.createHmac("sha512", secret.trim()).update(sorted).digest("hex");
  return timingSafeEqualHex(expected, signature);
}
