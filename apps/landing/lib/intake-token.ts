import { createHmac } from "crypto";

/**
 * Intake token format (Phase 1):
 *
 *   <subscriberId>.<expiryTimestamp>.<hmac>
 *
 * The HMAC is SHA-256 over "<subscriberId>.<expiryTimestamp>" keyed with INTAKE_TOKEN_SECRET.
 * Tokens expire after 7 days from issuance.
 */
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface IntakeTokenPayload {
  subscriberId: string;
  expiresAt: number;
}

export function generateIntakeToken(subscriberId: string): string {
  const secret = process.env.INTAKE_TOKEN_SECRET || "dev-secret-change-me";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${subscriberId}.${expiresAt}`;
  const hmac = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${hmac}`;
}

export function verifyIntakeToken(token: string): IntakeTokenPayload | null {
  const secret = process.env.INTAKE_TOKEN_SECRET || "dev-secret-change-me";
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [subscriberId, expiresAtStr, providedHmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) return null;

  // Check expiry
  if (Date.now() > expiresAt) return null;

  // Verify HMAC
  const payload = `${subscriberId}.${expiresAt}`;
  const expectedHmac = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  if (providedHmac !== expectedHmac) return null;

  return { subscriberId, expiresAt };
}
