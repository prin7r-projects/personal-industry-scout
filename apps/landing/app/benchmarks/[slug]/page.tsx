import { notFound } from "next/navigation";
import { ScoreChart } from "@/components/benchmarks/score-chart";
import { getBenchmarkBySlug } from "@/lib/benchmarks";

export const dynamic = "force-dynamic";

function formatScore(value: number, unit: string) {
  if (unit === "ratio") return value.toFixed(1);
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

export default async function BenchmarkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const benchmark = await getBenchmarkBySlug(slug);

  if (!benchmark) notFound();

  const bestScore = benchmark.scores[0];

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-rule bg-canvas/90">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-6 lg:px-10">
          <a href="/" className="font-serif text-[18px] font-semibold italic leading-none">
            Scout
          </a>
          <a
            href="/#pricing"
            className="inline-flex h-9 items-center justify-center border border-ink px-4 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
          >
            Subscribe
          </a>
        </div>
      </header>

      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-page gap-10 px-6 py-14 lg:grid-cols-12 lg:px-10 lg:py-20">
          <div className="lg:col-span-5">
            <div className="mb-8 flex items-center gap-3">
              <span className="inline-block h-0.5 w-9 bg-ink" />
              <span className="tag">TRIAD SCORE DETAIL</span>
            </div>

            <p className="tag mb-3">{benchmark.category}</p>
            <h1 className="font-serif text-[44px] font-semibold leading-[1.04] tracking-tight text-ink sm:text-[56px]">
              {benchmark.name}
            </h1>
            <p className="mt-6 max-w-prose text-lede text-graphite">{benchmark.description}</p>

            {bestScore ? (
              <div className="mt-9 border-l border-ink pl-5">
                <p className="tag mb-2">Current leader</p>
                <p className="font-serif text-[28px] font-semibold leading-tight">
                  {bestScore.label} · {formatScore(bestScore.value, bestScore.unit)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-7">
            <section className="border border-rule bg-page p-6 shadow-memo sm:p-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[28px] font-semibold leading-tight">
                    Provider scores
                  </h2>
                  <p className="mt-2 text-caption text-graphite">
                    Seeded Triad benchmark results by provider class.
                  </p>
                </div>
                <p className="tag">N · {benchmark.scores.length}</p>
              </div>
              <ScoreChart scores={benchmark.scores} />
            </section>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-6 py-10 lg:px-10">
        <div className="overflow-hidden border border-rule bg-page">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead className="border-b border-rule bg-mist/50">
              <tr>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
                  Provider
                </th>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
                  Score
                </th>
                <th className="px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              {benchmark.scores.map((score) => (
                <tr key={score.provider} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-4 font-medium">{score.label}</td>
                  <td className="px-5 py-4 font-mono text-[13px]">
                    {formatScore(score.value, score.unit)}
                  </td>
                  <td className="px-5 py-4 text-graphite">{score.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

