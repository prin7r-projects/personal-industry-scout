import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

/**
 * [SCOUT_SITEMAP] Dynamic XML sitemap for the landing site.
 *
 * Reachable at /sitemap.xml (Next.js App Router convention). It surfaces the
 * public marketing routes plus any benchmark pages that are published.
 * robots.txt references this URL.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://personal-industry-scout.prin7r.com";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/#how", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/#coverage", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/#pricing", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/#faq", priority: 0.6, changeFrequency: "monthly" as const }
];

function benchmarkSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));

  try {
    const benchmarks = await prisma.benchmark.findMany({
      select: { name: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    for (const benchmark of benchmarks) {
      entries.push({
        url: `${SITE_URL}/benchmarks/${benchmarkSlug(benchmark.name)}`,
        lastModified: benchmark.createdAt,
        changeFrequency: "weekly",
        priority: 0.7
      });
    }
  } catch {
    // DB unavailable — sitemap still serves the static routes.
  }

  return entries;
}
