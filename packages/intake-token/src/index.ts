import { createHmac } from "crypto";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface IntakeTokenPayload {
  subscriberId: string;
  expiresAt: number;
}

function getSecret(): string {
  const secret = process.env.INTAKE_TOKEN_SECRET;
  if (!secret) {
    throw new Error("INTAKE_TOKEN_SECRET environment variable is not set");
  }
  return secret;
}

export function generateIntakeToken(subscriberId: string): string {
  const secret = getSecret();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${subscriberId}.${expiresAt}`;
  const hmac = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${hmac}`;
}

export function verifyIntakeToken(token: string): IntakeTokenPayload | null {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [subscriberId, expiresAtStr, providedHmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) return null;

  if (Date.now() > expiresAt) return null;

  const payload = `${subscriberId}.${expiresAt}`;
  const expectedHmac = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  if (providedHmac !== expectedHmac) return null;

  return { subscriberId, expiresAt };
}
