"use client";

import { useState } from "react";
import { useExpensesTrend } from "@/lib/hooks/use-dashboard-stats";
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

/** Renders daily expense totals as a line chart for the last N days. */
export function ExpensesTrendChart() {
  const [days, setDays] = useState(7);
  const { data, isLoading } = useExpensesTrend(days);

  const dateFormat = days > 60 ? "MMM yyyy" : "MMM d";
  const chartData = (data ?? []).map((e) => ({
    rawDate: e.date,
    Expenses: e.total,
  }));
  const xInterval = Math.max(0, Math.ceil(chartData.length / 6) - 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base">Expenses Trend</CardTitle>
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
              <XAxis
                dataKey="rawDate"
                tick={{ fontSize: 12 }}
                stroke="var(--muted-foreground)"
                interval={xInterval}
                tickFormatter={(val) => format(new Date(val + "T12:00:00"), dateFormat)}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={80} tickFormatter={formatAxisTick} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Expenses"]}
                labelFormatter={(val) => format(new Date(val + "T12:00:00"), "MMM d, yyyy")}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                stroke="#EF4444"
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
