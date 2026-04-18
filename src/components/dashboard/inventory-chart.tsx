"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function InventoryChart({ data }: InventoryChartProps) {
  const chartData = data
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 10)
    .map((item) => ({
      name: `${item.product_type}-${item.product_size}`,
      stock: Number(item.current_stock),
      threshold: Number(item.low_stock_threshold),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 — Inventory Levels</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No inventory data yet
          </p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
