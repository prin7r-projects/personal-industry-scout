import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactBody = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: ContactBody = {};
  try {
    body = (await request.json()) as ContactBody;
  } catch {
    body = {};
  }

  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const topic = asString(body.topic) || "general";
  const message = asString(body.message);

  if (name.length === 0) {
    return NextResponse.json(
      { ok: false, error: "name_required", message: "Please share a name we can address you by." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email", message: "A valid email is required." },
      { status: 400 }
    );
  }
  if (message.length < 12) {
    return NextResponse.json(
      { ok: false, error: "message_too_short", message: "Tell us a little more (12+ characters)." },
      { status: 400 }
    );
  }

  const ticketId = `CONTACT-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
  const receivedAt = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    ticketId,
    receivedAt,
    routedTo: "desk@personal-industry-scout.prin7r.com",
    sla: "Replies within 12 hours, Monday through Friday"
  });
}
