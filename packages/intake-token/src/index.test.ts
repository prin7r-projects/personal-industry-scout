import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateIntakeToken, verifyIntakeToken } from "./index.js";

const TEST_SECRET = "test-secret-intake-token";

describe("generateIntakeToken", () => {
  beforeEach(() => {
    process.env.INTAKE_TOKEN_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.INTAKE_TOKEN_SECRET;
  });

  it("returns a dot-delimited token string", () => {
    const token = generateIntakeToken("sub-001");
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("sub-001");
  });

  it("returns different tokens for different subscriber IDs", () => {
    const t1 = generateIntakeToken("sub-001");
    const t2 = generateIntakeToken("sub-002");
    expect(t1).not.toBe(t2);
    expect(t1.split(".")[0]).toBe("sub-001");
    expect(t2.split(".")[0]).toBe("sub-002");
  });

  it("throws when INTAKE_TOKEN_SECRET is not set", () => {
    delete process.env.INTAKE_TOKEN_SECRET;
    expect(() => generateIntakeToken("sub-001")).toThrow(
      "INTAKE_TOKEN_SECRET environment variable is not set"
    );
  });
});

describe("verifyIntakeToken", () => {
  beforeEach(() => {
    process.env.INTAKE_TOKEN_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.INTAKE_TOKEN_SECRET;
  });

  it("returns payload for a valid token", () => {
    const token = generateIntakeToken("sub-001");
    const result = verifyIntakeToken(token);
    expect(result).not.toBeNull();
    expect(result!.subscriberId).toBe("sub-001");
    expect(typeof result!.expiresAt).toBe("number");
  });

  it("returns null for a tampered token", () => {
    const token = generateIntakeToken("sub-001");
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.deadbeef00000000`;
    expect(verifyIntakeToken(tampered)).toBeNull();
  });

  it("returns null for a token with tampered subscriber ID", () => {
    const token = generateIntakeToken("sub-001");
    const parts = token.split(".");
    const tampered = `sub-002.${parts[1]}.${parts[2]}`;
    expect(verifyIntakeToken(tampered)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = generateIntakeToken("sub-001");
    const parts = token.split(".");
    const expired = `${parts[0]}.1.${parts[2]}`;
    expect(verifyIntakeToken(expired)).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(verifyIntakeToken("")).toBeNull();
    expect(verifyIntakeToken("abc")).toBeNull();
    expect(verifyIntakeToken("a.b")).toBeNull();
    expect(verifyIntakeToken("a.b.c.d")).toBeNull();
    expect(verifyIntakeToken("a.notanumber.c")).toBeNull();
  });

  it("throws when INTAKE_TOKEN_SECRET is not set", () => {
    delete process.env.INTAKE_TOKEN_SECRET;
    expect(() => verifyIntakeToken("a.b.c")).toThrow(
      "INTAKE_TOKEN_SECRET environment variable is not set"
    );
  });
});
