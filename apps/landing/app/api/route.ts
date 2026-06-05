import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "personal-industry-scout-landing",
    routes: {
      health: "/api/health",
      scoutOnboard: "/api/scout/onboard",
      contact: "/api/contact",
      checkout: "/api/checkout/nowpayments",
      intake: "/api/intake/[token]",
      webhooks: "/api/webhooks/nowpayments"
    },
    timestamp: new Date().toISOString()
  });
}
