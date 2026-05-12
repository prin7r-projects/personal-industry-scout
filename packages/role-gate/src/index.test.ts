import { describe, it, expect } from "vitest";
import { tierMeets, tierLabel, highestTier } from "./index.js";

describe("tierMeets", () => {
  it("operator meets operator", () => {
    expect(tierMeets("operator", "operator")).toBe(true);
  });

  it("operator does not meet partner", () => {
    expect(tierMeets("operator", "partner")).toBe(false);
  });

  it("operator does not meet concierge", () => {
    expect(tierMeets("operator", "concierge")).toBe(false);
  });

  it("partner meets operator", () => {
    expect(tierMeets("partner", "operator")).toBe(true);
  });

  it("partner meets partner", () => {
    expect(tierMeets("partner", "partner")).toBe(true);
  });

  it("partner does not meet concierge", () => {
    expect(tierMeets("partner", "concierge")).toBe(false);
  });

  it("concierge meets all tiers", () => {
    expect(tierMeets("concierge", "operator")).toBe(true);
    expect(tierMeets("concierge", "partner")).toBe(true);
    expect(tierMeets("concierge", "concierge")).toBe(true);
  });

  it("returns false for null user tier", () => {
    expect(tierMeets(null, "operator")).toBe(false);
    expect(tierMeets(null, "partner")).toBe(false);
  });

  it("returns false for undefined user tier", () => {
    expect(tierMeets(undefined, "operator")).toBe(false);
    expect(tierMeets(undefined, "concierge")).toBe(false);
  });

  it("returns false for unknown tier string", () => {
    expect(tierMeets("superadmin", "operator")).toBe(false);
  });
});

describe("tierLabel", () => {
  it("returns proper labels", () => {
    expect(tierLabel("operator")).toBe("Operator");
    expect(tierLabel("partner")).toBe("Partner");
    expect(tierLabel("concierge")).toBe("Concierge");
  });

  it("falls back to Operator for unknown input", () => {
    expect(tierLabel(null)).toBe("Operator");
    expect(tierLabel(undefined)).toBe("Operator");
    expect(tierLabel("unknown")).toBe("Operator");
  });
});

describe("highestTier", () => {
  it("returns operator for empty array", () => {
    expect(highestTier([])).toBe("operator");
  });

  it("returns the single tier from a one-element array", () => {
    expect(highestTier(["partner"])).toBe("partner");
  });

  it("returns concierge when concierge is present", () => {
    expect(highestTier(["operator", "partner", "concierge"])).toBe("concierge");
  });

  it("returns partner when partner and operator are present", () => {
    expect(highestTier(["operator", "partner"])).toBe("partner");
  });

  it("skips null and undefined entries", () => {
    expect(highestTier([null, "partner", undefined])).toBe("partner");
  });

  it("returns operator for all null/undefined entries", () => {
    expect(highestTier([null, undefined])).toBe("operator");
  });
});
