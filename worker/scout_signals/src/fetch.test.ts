import { describe, it, expect } from "vitest";
import { fetchSignals } from "./fetch.js";

describe("fetchSignals", () => {
  it("is a function", () => {
    expect(typeof fetchSignals).toBe("function");
  });

  it("returns stub result when no API key provided", async () => {
    const prisma = {
      scout: {
        findUnique: async () => ({
          id: "test-scout-id",
          name: "Test Scout",
          industryFocus: "AI",
        }),
      },
      signal: {
        create: async () => ({}),
      },
      $disconnect: async () => {},
    } as unknown as import("@pis/db").PrismaClient;

    const result = await fetchSignals(prisma, "test-scout-id");
    expect(result.scoutId).toBe("test-scout-id");
    expect(result.industry).toBe("AI");
    expect(result.total).toBe(0);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("throws when scout not found", async () => {
    const prisma = {
      scout: {
        findUnique: async () => null,
      },
      $disconnect: async () => {},
    } as unknown as import("@pis/db").PrismaClient;

    await expect(fetchSignals(prisma, "nonexistent")).rejects.toThrow(
      "Scout not found",
    );
  });
});
