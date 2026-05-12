import { describe, it, expect, afterEach } from "vitest";
import { sendEmail, sendIntakeLink, sendWeeklyBrief } from "./postmark.js";

describe("sendEmail", () => {
  afterEach(() => {
    delete process.env.POSTMARK_SERVER_TOKEN;
  });

  it("returns stub result when POSTMARK_SERVER_TOKEN is not set", async () => {
    delete process.env.POSTMARK_SERVER_TOKEN;
    const result = await sendEmail({
      to: "test@example.com",
      templateAlias: "intake-link",
      templateModel: { intake_url: "https://example.com" },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("POSTMARK_SERVER_TOKEN is not set");
  });
});

describe("sendIntakeLink", () => {
  afterEach(() => {
    delete process.env.POSTMARK_SERVER_TOKEN;
  });

  it("returns stub result when token is missing", async () => {
    delete process.env.POSTMARK_SERVER_TOKEN;
    const result = await sendIntakeLink("test@example.com", "https://example.com/intake");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("POSTMARK_SERVER_TOKEN is not set");
  });
});

describe("sendWeeklyBrief", () => {
  afterEach(() => {
    delete process.env.POSTMARK_SERVER_TOKEN;
  });

  it("returns stub result when token is missing", async () => {
    delete process.env.POSTMARK_SERVER_TOKEN;
    const result = await sendWeeklyBrief(
      "test@example.com",
      "https://example.com/brief.pdf",
      "AI",
      "Week 20",
      "Test Scout"
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("POSTMARK_SERVER_TOKEN is not set");
  });
});
