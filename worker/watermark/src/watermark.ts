/**
 * Watermark service — generates per-subscriber watermarked PDFs.
 *
 * Input:  subscriberEmail, watermarkUuid, briefBodyMd, citations[]
 * Output: PDF Buffer with watermark UUID in metadata + visible grid pattern.
 *
 * Design per docs/01: Source Serif 4 body, Inter UI labels, oxblood accent only.
 * The watermark grid is a repeating 48px diagonal pattern of semi-transparent
 * subscriber-specific hex derived from the watermark UUID.
 */

import puppeteer, { Browser, Page } from "puppeteer";

export interface WatermarkInput {
  subscriberEmail: string;
  watermarkUuid: string;
  briefBodyMd: string;
  citations: Array<{ citeId: string; url: string; title: string }>;
  briefIndustry: string;
  briefIsoweek: number;
  scoutName: string;
  signedAt?: string;
}

// ── Browser pool ──

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

// ── PDF generation ──

export async function generateWatermarkedPdf(input: WatermarkInput): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const html = buildHtml(input);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
      displayHeaderFooter: false,
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// ── HTML builder ──

function buildHtml(input: WatermarkInput): string {
  const { subscriberEmail, watermarkUuid, briefBodyMd, citations, briefIndustry, briefIsoweek, scoutName, signedAt } = input;

  // Derive a stable grid color from the watermark UUID (subtle, non-obvious)
  const gridColor = deriveGridColor(watermarkUuid);

  // Format the ISO week for display (e.g., "W19, 2026")
  const weekYear = `W${briefIsoweek % 100}, ${Math.floor(briefIsoweek / 100)}`;
  const signedAtDisplay = signedAt
    ? new Date(signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  // Convert brief body markdown to simple HTML paragraphs
  const bodyHtml = markdownToHtml(briefBodyMd);

  // Build citations list
  const citationsHtml = citations
    .map(
      (c) =>
        `<li class="cite-item"><span class="tag">${escapeHtml(c.citeId)}</span> <a href="${escapeHtml(c.url)}" class="cite-link">${escapeHtml(c.title)}</a></li>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="watermark-uuid" content="${escapeHtml(watermarkUuid)}">
<title>${escapeHtml(briefIndustry)} — ${weekYear}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --canvas: #FAFAF8;
    --ink: #11110F;
    --graphite: #5C5A55;
    --ash: #8A867E;
    --rule: #E6E2D9;
    --oxblood: #7A1F2B;
    --grid: ${gridColor};
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 11pt;
    line-height: 1.65;
    color: var(--ink);
    background: white;
    position: relative;
  }

  /* Watermark grid — non-obvious visible pattern */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image: repeating-linear-gradient(
      45deg,
      var(--grid) 0px,
      var(--grid) 0.5px,
      transparent 0.5px,
      transparent 48px
    ),
    repeating-linear-gradient(
      -45deg,
      var(--grid) 0px,
      var(--grid) 0.5px,
      transparent 0.5px,
      transparent 48px
    );
    opacity: 0.12;
  }

  .content { position: relative; z-index: 1; }

  /* Masthead */
  .masthead {
    text-align: center;
    padding-bottom: 24px;
    margin-bottom: 32px;
    border-bottom: 1px solid var(--rule);
  }
  .seal {
    display: inline-flex;
    width: 48px; height: 48px;
    border-radius: 9999px;
    background: radial-gradient(circle at 35% 30%, #9B2A37, #7A1F2B 55%, #5C171F);
    color: #FAFAF8;
    align-items: center; justify-content: center;
    font-family: 'Source Serif 4', serif;
    font-style: italic; font-weight: 600;
    font-size: 18px;
    transform: rotate(-6deg);
    margin-bottom: 12px;
  }
  .masthead h1 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-weight: 600;
    font-size: 18pt;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 4px;
  }
  .masthead .meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    color: var(--ash);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .bar-oxblood {
    display: inline-block;
    width: 36px; height: 2px;
    background: var(--oxblood);
    margin: 8px 0;
  }

  /* Watermark page */
  .watermark-banner {
    background: var(--canvas);
    border: 1px solid var(--rule);
    padding: 16px 20px;
    margin-bottom: 32px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    color: var(--ash);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .watermark-banner .label { color: var(--graphite); }
  .watermark-banner .value { color: var(--ash); word-break: break-all; }

  /* Body */
  .brief-body {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 11pt;
    line-height: 1.7;
  }
  .brief-body h2 {
    font-family: 'Source Serif 4', Georgia, serif;
    font-weight: 600;
    font-size: 13pt;
    color: var(--oxblood);
    margin-top: 24px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--rule);
  }
  .brief-body p {
    margin-bottom: 10px;
  }
  .brief-body strong {
    font-weight: 600;
  }

  /* Signature */
  .signature {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--rule);
    font-family: 'Inter', sans-serif;
    font-size: 9pt;
    color: var(--graphite);
  }
  .signature .name {
    font-family: 'Source Serif 4', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: 12pt;
    color: var(--ink);
  }

  /* Citations */
  .citations {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
  }
  .citations h3 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ash);
    margin-bottom: 12px;
  }
  .citations ol {
    list-style: none;
    padding: 0;
  }
  .cite-item {
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    line-height: 1.5;
    margin-bottom: 6px;
    color: var(--graphite);
  }
  .cite-item .tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    letter-spacing: 0.06em;
    color: var(--ash);
    margin-right: 6px;
  }
  .cite-link {
    color: var(--graphite);
    text-decoration: none;
    border-bottom: 1px dotted var(--rule);
  }

  /* Print optimizations */
  @page {
    size: A4;
    margin: 18mm 14mm;
  }
  @media print {
    body { background: white; }
    body::before { opacity: 0.10; }
  }
</style>
</head>
<body>
<div class="content">

  <!-- Masthead -->
  <div class="masthead">
    <div class="seal">S</div>
    <h1>${escapeHtml(briefIndustry)}</h1>
    <div class="meta">Vol 14 · ${weekYear} · Filed ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
    <div class="bar-oxblood"></div>
  </div>

  <!-- Watermark banner -->
  <div class="watermark-banner">
    <div><span class="label">WATERMARK</span> <span class="value">${escapeHtml(watermarkUuid)}</span></div>
    <div><span class="label">SUBSCRIBER</span> <span class="value">${escapeHtml(subscriberEmail)}</span></div>
  </div>

  <!-- Brief body -->
  <div class="brief-body">
    ${bodyHtml}
  </div>

  <!-- Signature -->
  <div class="signature">
    <div class="name">${escapeHtml(scoutName)}</div>
    <div>Filed from New York · Signed ${signedAtDisplay || "pending"}</div>
  </div>

  <!-- Citations -->
  <div class="citations">
    <h3>Sources</h3>
    <ol>${citationsHtml}</ol>
  </div>

</div>
</body>
</html>`;
}

// ── Helpers ──

/**
 * Derive a subtle grid color from a UUID for per-subscriber watermark differentiation.
 * Returns a CSS rgba color with very low opacity.
 */
function deriveGridColor(uuid: string): string {
  // Use first 6 hex chars of a simple hash
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) & 0xffffff;
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `rgba(${r},${g},${b},0.15)`;
}

/**
 * Convert very simple markdown to HTML.
 * Supports: # heading, ## subheading, **bold**, paragraphs.
 */
function markdownToHtml(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("## ")) {
        return `<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h2>${inlineMarkdown(trimmed.slice(2))}</h2>`;
      }
      return `<p>${inlineMarkdown(trimmed)}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

function inlineMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
