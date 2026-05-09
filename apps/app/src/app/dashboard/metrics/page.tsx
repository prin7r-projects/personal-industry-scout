"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type DashboardMetrics } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const TENDER_STATUS_COLORS: Record<string, string> = {
  open: "#22d3ee",
  closed: "#71717a",
  awarded: "#a3e635",
  draft: "#fbbf24",
};

const PIE_COLORS = ["#22d3ee", "#a3e635", "#fbbf24", "#f472b6", "#a78bfa", "#71717a"];

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchMetrics}
          className="rounded bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const statusPieData = Object.entries(metrics.tenders.byStatus).map(
    ([status, count]) => ({
      name: status,
      value: count,
    }),
  );

  const topMatchesData = metrics.user.matches.top.map((m) => ({
    name:
      m.tender.title.length > 25
        ? m.tender.title.slice(0, 25) + "..."
        : m.tender.title,
    score: m.score,
    fullTitle: m.tender.title,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Metrics</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Campaign performance and tender activity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Tenders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">
              {metrics.tenders.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watching</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">
              {metrics.user.watches}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">
              {metrics.user.matches.total}
            </p>
            {metrics.user.matches.unseen > 0 && (
              <p className="mt-1 text-xs text-cyan-400">
                {metrics.user.matches.unseen} unseen
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-zinc-100">
              {metrics.user.matches.avgScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tenders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No tender data available
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusPieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            TENDER_STATUS_COLORS[statusPieData[i].name] ??
                            PIE_COLORS[i % PIE_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#f4f4f5",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Match Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {topMatchesData.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No match data available
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topMatchesData}
                    layout="vertical"
                    margin={{ left: 8, right: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      axisLine={{ stroke: "#3f3f46" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#f4f4f5",
                      }}
                      formatter={(value: number) => [`${value}`, "Score"]}
                      labelFormatter={(label) =>
                        topMatchesData.find((m) => m.name === label)
                          ?.fullTitle ?? label
                      }
                    />
                    <Bar
                      dataKey="score"
                      fill="#22d3ee"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {metrics.user.matches.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                    <th className="pb-2 pr-4 font-medium">Tender</th>
                    <th className="pb-2 pr-4 font-medium">Buyer</th>
                    <th className="pb-2 pr-4 font-medium">Score</th>
                    <th className="pb-2 pr-4 font-medium">Value</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.user.matches.recent.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-800/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-zinc-200">
                        {m.tender.title}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {m.tender.buyer}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`text-xs font-medium ${
                            m.score >= 80
                              ? "text-lime-400"
                              : m.score >= 50
                                ? "text-cyan-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {m.score}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {m.tender.value != null
                          ? `£${m.tender.value.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="py-2.5 text-zinc-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
