"use client";

import { useState } from "react";
import { useSalesTrend } from "@/lib/hooks/use-dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatAxisTick } from "@/lib/format";
import { DayRangePicker, getRangeLabel } from "@/components/visualization/DayRangePicker";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

/** Renders daily sales totals as a line chart for the last N days. */
export function SalesTrendChart() {
  const [days, setDays] = useState(7);
  const { data, isLoading } = useSalesTrend(days);

  // ≤60 days: "Apr 18" | >60 days: "Apr 2022" — full year avoids ambiguity with day numbers.
  const dateFormat = days > 60 ? "MMM yyyy" : "MMM d";
  const chartData = (data ?? []).map((s) => ({
    date: format(new Date(s.date + "T12:00:00"), dateFormat),
    Sales: s.total,
  }));
  const xInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base">Sales Trend</CardTitle>
          <span className="inline-block mt-1 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full">
            {getRangeLabel(days)}
          </span>
        </div>
        <DayRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" interval={xInterval} />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={80} tickFormatter={formatAxisTick} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Sales"]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="Sales"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
