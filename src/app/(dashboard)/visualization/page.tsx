"use client";

import { useState } from "react";
import { useInventory } from "@/lib/hooks/use-inventory";
import {
  useSalesTrend,
  useExpensesTrend,
  useExpensesByCategory,
  useTopProducts,
} from "@/lib/hooks/use-dashboard-stats";
import { InventoryChart } from "@/components/dashboard/inventory-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

export default function VisualizationPage() {
  const { data: inventory, isLoading: invLoading } = useInventory();

  const [trendDays, setTrendDays] = useState(7);
  const { data: salesTrend } = useSalesTrend(trendDays);
  const { data: expensesTrend } = useExpensesTrend(trendDays);
  const { data: expensesByCategory } = useExpensesByCategory();
  const { data: productRanking } = useTopProducts(5);

  // Merge sales + expenses trends for the combined chart
  const combinedTrend = (salesTrend ?? []).map((s, i) => ({
    date: format(new Date(s.date), "MMM d"),
    Sales: s.total,
    Expenses: expensesTrend?.[i]?.total ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visualization</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Charts and analytics for sales, expenses, and inventory
        </p>
      </div>

      {/* Sales & Expenses Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Sales & Expenses Trend</CardTitle>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  trendDays === d
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
              <Tooltip
                formatter={(value) => [`${formatCurrency(Number(value))}`, undefined]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Sales" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expenses by Category + Top 10 Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory && expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={100} stroke="var(--muted-foreground)" />
                  <Tooltip
                    formatter={(value) => [`${formatCurrency(Number(value))}`, "Total"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] py-8 text-center">
                No expenses recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 10 Inventory Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <Skeleton className="h-72" />
            ) : (
              <InventoryChart data={inventory ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Sold & Least Sold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-emerald-600">Most Sold Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRanking?.top.length ? (
                  productRanking.top.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">
                        {p.product_type}{p.product_size ? ` - ${p.product_size}` : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm">{p.total_quantity}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(p.total_revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-sm text-[var(--muted-foreground)]">
                      No sales data yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-600">Least Sold Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productRanking?.bottom.length ? (
                  productRanking.bottom.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">
                        {p.product_type}{p.product_size ? ` - ${p.product_size}` : ""}
                      </TableCell>
                      <TableCell className="text-right text-sm">{p.total_quantity}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(p.total_revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-sm text-[var(--muted-foreground)]">
                      No sales data yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
