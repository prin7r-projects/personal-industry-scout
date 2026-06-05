import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OnboardBody = {
  name?: unknown;
  email?: unknown;
  industries?: unknown;
  companies?: unknown;
  geos?: unknown;
  tz?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((s) => s.length > 0);
}

export async function POST(request: Request) {
  let body: OnboardBody = {};
  try {
    body = (await request.json()) as OnboardBody;
  } catch {
    body = {};
  }

  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const industries = asStringArray(body.industries);
  const companies = asStringArray(body.companies);
  const geos = asStringArray(body.geos);
  const tz = asString(body.tz);

  if (name.length === 0) {
    return NextResponse.json(
      { ok: false, error: "name_required", message: "Subscriber name is required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email", message: "A valid subscriber email is required." },
      { status: 400 }
    );
  }
  if (industries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "industries_required", message: "Select at least one industry." },
      { status: 400 }
    );
  }
  if (geos.length === 0) {
    return NextResponse.json(
      { ok: false, error: "geos_required", message: "Select at least one region." },
      { status: 400 }
    );
  }
  if (tz.length === 0) {
    return NextResponse.json(
      { ok: false, error: "tz_required", message: "Select your timezone." },
      { status: 400 }
    );
  }

  const intakeId = `INTAKE-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return NextResponse.json({
    ok: true,
    intakeId,
    createdAt,
    expiresAt,
    summary: {
      name,
      email,
      industries,
      companies,
      geos,
      tz
    }
  });
}
