"use client";

import { useState } from "react";
import { useExpensesTrend } from "@/lib/hooks/use-dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatAxisTick } from "@/lib/format";
import { DayRangePicker } from "@/components/visualization/DayRangePicker";
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

  const chartData = (data ?? []).map((e) => ({
    date: format(new Date(e.date), "MMM d"),
    Expenses: e.total,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Expenses Trend</CardTitle>
        <DayRangePicker days={days} onChange={setDays} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" interval={Math.ceil(chartData.length / 6) - 1} />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={80} tickFormatter={formatAxisTick} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Expenses"]}
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
