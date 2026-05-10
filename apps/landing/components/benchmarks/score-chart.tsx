"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BenchmarkScore } from "@/lib/benchmarks";

function formatScore(value: number, unit: string) {
  if (unit === "ratio") return value.toFixed(1);
  if (unit === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

export function ScoreChart({ scores }: { scores: BenchmarkScore[] }) {
  return (
    <div className="h-[320px] w-full" aria-label="Provider score comparison chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={scores} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#E6E2D9" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#5C5A55", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#5C5A55", fontSize: 12 }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "#F2EFE7" }}
            formatter={(value, _name, item) => [
              formatScore(Number(value), item.payload.unit),
              "Score",
            ]}
            labelStyle={{ color: "#11110F", fontWeight: 600 }}
            contentStyle={{
              border: "1px solid #E6E2D9",
              borderRadius: 2,
              color: "#11110F",
              boxShadow: "0 12px 36px -16px rgba(17,17,15,0.16)",
            }}
          />
          <Bar dataKey="value" fill="#11110F" radius={[2, 2, 0, 0]} maxBarSize={88} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

