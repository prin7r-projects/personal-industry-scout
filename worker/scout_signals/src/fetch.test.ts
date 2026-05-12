import { describe, it, expect } from "vitest";
import { fetchSignals } from "./fetch.js";
import { fetchSignalsForAllScouts } from "./main.js";

function stubPrisma(scouts: Array<{ id: string; name: string; industryFocus: string }>) {
  return {
    scout: {
      findMany: async () => scouts,
      findUnique: async (args: { where: { id: string } }) => {
        const s = scouts.find((s) => s.id === args.where.id);
        return s ? { ...s } : null;
      },
    },
    signal: {
      create: async () => ({}),
      findFirst: async () => null,
    },
    $disconnect: async () => {},
  } as unknown as import("@pis/db").PrismaClient;
}

describe("fetchSignals", () => {
  it("is a function", () => {
    expect(typeof fetchSignals).toBe("function");
  });

  it("returns stub result when no API key provided", async () => {
    const prisma = stubPrisma([
      { id: "test-scout-id", name: "Test Scout", industryFocus: "AI" },
    ]);

    const result = await fetchSignals(prisma, "test-scout-id");
    expect(result.scoutId).toBe("test-scout-id");
    expect(result.industry).toBe("AI");
    expect(result.total).toBe(0);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("throws when scout not found", async () => {
    const prisma = stubPrisma([]);

    await expect(fetchSignals(prisma, "nonexistent")).rejects.toThrow(
      "Scout not found",
    );
  });
});

describe("fetchSignalsForAllScouts", () => {
  it("returns empty array when no active scouts", async () => {
    const prisma = stubPrisma([]);
    const { results, failedCount } = await fetchSignalsForAllScouts(prisma);
    expect(results).toEqual([]);
    expect(failedCount).toBe(0);
  });

  it("iterates over all active scouts", async () => {
    const prisma = stubPrisma([
      { id: "scout-1", name: "Alice", industryFocus: "AI" },
      { id: "scout-2", name: "Bob", industryFocus: "Fintech" },
    ]);

    const { results } = await fetchSignalsForAllScouts(prisma);
    expect(results).toHaveLength(2);
    expect(results[0].scoutId).toBe("scout-1");
    expect(results[1].scoutId).toBe("scout-2");
  });

  it("skips scouts without industry focus when API key missing", async () => {
    const prisma = stubPrisma([
      { id: "scout-1", name: "Alice", industryFocus: "" },
    ]);

    const { results } = await fetchSignalsForAllScouts(prisma);
    expect(results).toHaveLength(1);
    expect(results[0].industry).toBe("");
    expect(results[0].total).toBe(0);
  });
});
