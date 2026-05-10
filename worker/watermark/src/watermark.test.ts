import { describe, it, expect } from "vitest";
import { generateWatermarkedPdf } from "../src/watermark.js";

describe("watermark", () => {
  it("generates a PDF for a fixture subscriber", async () => {
    // Skip if Chrome is not installed (CI/headless environments)
    let pdf: Buffer;
    try {
      pdf = await generateWatermarkedPdf({
        subscriberEmail: "test@personalindustryscout.com",
        watermarkUuid: "00000000-0000-0000-0000-000000000099",
        briefBodyMd: `# Vertical SaaS — Week 19, 2026\n\n## Deal\nServiceTitan closed a $120M growth round.`,
        citations: [
          {
            citeId: "C-2026W19-0001",
            url: "https://techcrunch.com/2026/05/02/servicetitan-120m-growth-round/",
            title: "ServiceTitan closes $120M growth round",
          },
        ],
        briefIndustry: "vertical-saas",
        briefIsoweek: 202619,
        scoutName: "J. Marsh",
        signedAt: "2026-05-04T09:42:00Z",
      });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("Chrome") || err.message.includes("browser"))) {
        console.log("[watermark test] Chrome not installed — skipping browser-dependent test");
        return;
      }
      throw err;
    }

    expect(pdf!).toBeInstanceOf(Buffer);
    expect(pdf!.length).toBeGreaterThan(1000);

    // Check PDF header
    const header = pdf!.subarray(0, 5).toString();
    expect(header).toBe("%PDF-");

    // Check that watermark UUID is embedded in the PDF
    const pdfStr = pdf!.toString("latin1");
    expect(pdfStr).toContain("00000000-0000-0000-0000-000000000099");

    // Check subscriber email is visible
    expect(pdfStr).toContain("test@personalindustryscout.com");
  });

  it("exports the generateWatermarkedPdf function", () => {
    expect(generateWatermarkedPdf).toBeDefined();
  });
});
