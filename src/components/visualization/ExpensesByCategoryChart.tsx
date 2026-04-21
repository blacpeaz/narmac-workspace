"use client";

import { useExpensesByCategory } from "@/lib/hooks/use-dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatAxisTick } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/** Shows all-time total spending broken down by expense category as a horizontal bar chart. */
export function ExpensesByCategoryChart() {
  const { data, isLoading } = useExpensesByCategory();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expenses by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : !data?.length ? (
          <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
            No expenses recorded yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 48)}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                stroke="var(--muted-foreground)"
                tickFormatter={formatAxisTick}
              />
              <YAxis
                dataKey="category"
                type="category"
                tick={{ fontSize: 12 }}
                width={110}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
