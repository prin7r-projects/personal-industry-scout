import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";

const OUTPUT_DIR = "/tmp/datasets";
const MODEL = process.env.SYNTH_MODEL ?? "gpt-4o-mini";

interface Spec {
  id: string;
  columns: string[];
  rowCount: number;
  prompt?: string;
}

interface Status {
  id: string;
  status: "generating" | "ready" | "error";
  rowCount: number;
  csvPath: string;
  error?: string;
}

function requiredEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function readSpec(input?: string): Spec {
  const raw = input
    ? readFileSync(resolve(input), "utf-8")
    : readFileSync(process.stdin.fd, "utf-8");
  const spec = JSON.parse(raw) as Spec;
  if (!spec.id) throw new Error("Spec must include an 'id' field");
  if (!Array.isArray(spec.columns) || spec.columns.length === 0) {
    throw new Error("Spec must include a non-empty 'columns' array");
  }
  if (typeof spec.rowCount !== "number" || spec.rowCount < 1) {
    throw new Error("Spec must include a positive 'rowCount'");
  }
  return spec;
}

function buildPrompt(spec: Spec): string {
  const columns = spec.columns.join(",");
  const context = spec.prompt ? ` Context: ${spec.prompt}` : "";
  return (
    `Generate ${spec.rowCount} rows of realistic synthetic CSV data.${context}\n\n` +
    `Output ONLY a valid CSV with these exact columns as the header row: ${columns}\n` +
    `Do not include any explanation, markdown fences, or extra text — just the raw CSV.`
  );
}

function parseCSV(text: string, expectedColumns: number): string {
  const trimmed = text.trim();
  const lines = trimmed.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    throw new Error(
      `LLM returned fewer than 2 lines (need header + data). Got:\n${trimmed.slice(0, 500)}`
    );
  }

  const header = lines[0];
  const headerCols = header.split(",").length;
  if (headerCols !== expectedColumns) {
    throw new Error(
      `Header column count mismatch. Expected ${expectedColumns}, got ${headerCols}`
    );
  }

  return trimmed + "\n";
}

async function run(specPath?: string) {
  const spec = readSpec(specPath);
  const apiKey = requiredEnv("OPENAI_API_KEY");
  const client = new OpenAI({ apiKey });

  const outDir = resolve(OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });

  const csvPath = resolve(outDir, `${spec.id}.csv`);
  const statusPath = resolve(outDir, `${spec.id}.status.json`);

  const status: Status = {
    id: spec.id,
    status: "generating",
    rowCount: spec.rowCount,
    csvPath,
  };
  writeFileSync(statusPath, JSON.stringify(status, null, 2));

  const prompt = buildPrompt(spec);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a synthetic data generator. Always output ONLY raw CSV with a header row. Never include explanations, markdown fences, or any text outside the CSV.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  const csv = parseCSV(content, spec.columns.length);
  writeFileSync(csvPath, csv);

  status.status = "ready";
  writeFileSync(statusPath, JSON.stringify(status, null, 2));

  const rowCount = csv.split("\n").filter((l) => l.trim()).length - 1;
  console.log(
    JSON.stringify({ id: spec.id, status: "ready", rows: rowCount, csvPath })
  );
}

const input = process.argv[2];
run(input).catch((err) => {
  console.error("synth failed:", err.message);
  process.exit(1);
});
