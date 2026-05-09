import { describe, it, expect } from "vitest";
import { runDelivery } from "../src/deliver.js";

describe("worker-deliver", () => {
  it("exports runDelivery function", () => {
    expect(runDelivery).toBeDefined();
  });

  it("runDelivery returns results array", async () => {
    const results = await runDelivery();
    expect(Array.isArray(results)).toBe(true);
    // In CI without Postgres, this should return empty array gracefully
  });
});
