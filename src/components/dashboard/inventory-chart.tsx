"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { InventoryItem } from "@/lib/types/database";

interface InventoryChartProps {
  data: InventoryItem[];
}

/**
 * Renders a bar chart comparing current stock vs. low-stock threshold
 * for the top 10 products by stock level.
 * Note: this component does NOT wrap itself in a Card — the parent is responsible.
 */
export function InventoryChart({ data }: InventoryChartProps) {
  // Take the top 10 products sorted by highest stock level.
  const chartData = data
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 10)
    .map((item) => ({
      name: item.product_size ? `${item.product_type} - ${item.product_size}` : item.product_type,
      stock: Number(item.current_stock),
      threshold: Number(item.low_stock_threshold),
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
        No inventory data yet
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar
          dataKey="stock"
          fill="var(--chart-1)"
          name="Current Stock"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="threshold"
          fill="var(--chart-4)"
          name="Threshold"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
