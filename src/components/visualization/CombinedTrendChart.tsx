"use client";

import { useState } from "react";
import { useSalesTrend, useExpensesTrend } from "@/lib/hooks/use-dashboard-stats";
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
  Legend,
} from "recharts";
import { format } from "date-fns";

/**
 * Overlays sales and expenses on a single dual-line chart so the user can
 * compare revenue vs costs for the same period at a glance.
 */
export function CombinedTrendChart() {
  const [days, setDays] = useState(7);
  const { data: salesTrend, isLoading: salesLoading } = useSalesTrend(days);
  const { data: expensesTrend, isLoading: expensesLoading } = useExpensesTrend(days);

  const isLoading = salesLoading || expensesLoading;

  // Merge both arrays by index — they share the same date range so alignment is guaranteed.
  const chartData = (salesTrend ?? []).map((s, i) => ({
    date: format(new Date(s.date), "MMM d"),
    Sales: s.total,
    Expenses: expensesTrend?.[i]?.total ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Sales vs Expenses</CardTitle>
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
                formatter={(value) => [formatCurrency(Number(value)), undefined]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Sales" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
