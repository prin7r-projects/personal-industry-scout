import { describe, it, expect } from "vitest";
import { fetchTenders } from "./fetch.js";

describe("tender-intake fetchTenders", () => {
  it("exports fetchTenders function", () => {
    expect(fetchTenders).toBeDefined();
    expect(typeof fetchTenders).toBe("function");
  });

  it("throws on unreachable URL", async () => {
    await expect(
      fetchTenders.bind(null, "http://127.0.0.1:19999/nonexistent.xml"),
    ).rejects.toThrow();
  });

  it("rejects non-200 HTTP responses", async () => {
    await expect(
      fetchTenders.bind(null, "https://example.com/nonexistent-path-98765"),
    ).rejects.toThrow();
  });
});
