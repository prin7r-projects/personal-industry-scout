import { prisma } from "./prisma";

export type BenchmarkScore = {
  provider: string;
  label: string;
  value: number;
  unit: "percent" | "count" | "ratio" | string;
};

export type BenchmarkDetail = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  scores: BenchmarkScore[];
};

type BenchmarkRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  value: number;
  unit: string;
};

const providerLabels: Record<string, string> = {
  frontier: "Frontier",
  "open-weight": "Open-weight",
  "cost-efficient": "Cost-efficient",
};

export function benchmarkSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getBenchmarkBySlug(slug: string): Promise<BenchmarkDetail | null> {
  const rows = await prisma.$queryRaw<BenchmarkRow[]>`
    SELECT
      b.id,
      b.name,
      b.description,
      b.category,
      s.industry AS provider,
      s.value,
      s.unit
    FROM benchmarks b
    LEFT JOIN scores s ON s.benchmark_id = b.id
    ORDER BY b.name ASC, s.value DESC
  `;

  const matchingRows = rows.filter((row) => benchmarkSlug(row.name) === slug);
  if (matchingRows.length === 0) return null;

  const benchmark = matchingRows[0];

  return {
    id: benchmark.id,
    name: benchmark.name,
    slug: benchmarkSlug(benchmark.name),
    description: benchmark.description,
    category: benchmark.category,
    scores: matchingRows
      .filter((row) => row.provider)
      .map((row) => ({
        provider: row.provider,
        label: providerLabels[row.provider] ?? row.provider,
        value: Number(row.value),
        unit: row.unit,
      })),
  };
}

