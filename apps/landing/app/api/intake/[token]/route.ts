import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIntakeToken } from "@/lib/intake-token";

/**
 * POST /api/intake/[token]
 *
 * Accepts a one-time intake token (valid 7 days) and persists the subscriber's
 * watchlist preferences + telegram pairing code.
 *
 * Body: { industries: string[], companies: string[], geos: string[], tz: string, telegramPairCode?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Verify token
  const payload = verifyIntakeToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired intake token." },
      { status: 401 }
    );
  }

  const { subscriberId } = payload;

  // Parse body
  let body: {
    industries?: string[];
    companies?: string[];
    geos?: string[];
    tz?: string;
    telegramPairCode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { industries, companies, geos, tz, telegramPairCode } = body;

  if (!industries || !Array.isArray(industries) || industries.length === 0) {
    return NextResponse.json(
      { error: "At least one industry is required." },
      { status: 400 }
    );
  }

  if (!tz) {
    return NextResponse.json(
      { error: "Timezone is required." },
      { status: 400 }
    );
  }

  // Validate telegram pairing code (6 digits)
  if (telegramPairCode && !/^\d{6}$/.test(telegramPairCode)) {
    return NextResponse.json(
      { error: "Telegram pairing code must be exactly 6 digits." },
      { status: 400 }
    );
  }

  // Upsert watchlist
  await prisma.watchlist.upsert({
    where: { subscriberId },
    update: {
      industries: industries as any,
      companies: (companies || []) as any,
      geos: (geos || []) as any,
    },
    create: {
      subscriberId,
      industries: industries as any,
      companies: (companies || []) as any,
      geos: (geos || []) as any,
    },
  });

  // Update subscriber timezone and pending telegram code
  await prisma.subscriber.update({
    where: { id: subscriberId },
    data: {
      tz,
      ...(telegramPairCode
        ? { telegramUserId: telegramPairCode } // stored as pending pairing code in Phase 1
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
