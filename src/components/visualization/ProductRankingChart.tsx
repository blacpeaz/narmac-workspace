"use client";

import { useState } from "react";
import { useTopProducts } from "@/lib/hooks/use-dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopProduct } from "@/lib/hooks/use-dashboard-stats";

/** Renders a ranked product table with product name, quantity sold, and revenue. */
function ProductTable({
  products,
  emptyMessage,
}: {
  products: TopProduct[];
  emptyMessage: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty Sold</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.length ? (
          products.map((p, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm text-[var(--muted-foreground)]">{i + 1}</TableCell>
              <TableCell className="font-medium text-sm">
                {p.product_type}
                {p.product_size ? ` - ${p.product_size}` : ""}
              </TableCell>
              <TableCell className="text-right text-sm">{p.total_quantity}</TableCell>
              <TableCell className="text-right text-sm font-semibold">
                {formatCurrency(p.total_revenue)}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-6 text-sm text-[var(--muted-foreground)]">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/**
 * Shows the top and bottom N products by quantity sold in a side-by-side card layout.
 * The user can pick whether to show top 5 or top 10.
 */
export function ProductRankingChart() {
  const [limit, setLimit] = useState(5);
  const { data: ranking, isLoading } = useTopProducts(limit);

  return (
    <div className="space-y-4">
      {/* Limit picker */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">Show top</p>
        <div className="flex gap-1">
          {[5, 10].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                limit === n
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most sold */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-600">Most Sold</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProductTable
                products={ranking?.top ?? []}
                emptyMessage="No sales data yet."
              />
            </CardContent>
          </Card>

          {/* Least sold */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-amber-600">Least Sold</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ProductTable
                products={ranking?.bottom ?? []}
                emptyMessage="No sales data yet."
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
