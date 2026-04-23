"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/lib/types/database";
import { AlertTriangle } from "lucide-react";

interface LowStockListProps {
  items: InventoryItem[];
}

/**
 * Renders a card listing inventory items that are LOW or OUT_OF_STOCK.
 * Shows an empty-state message when all stock levels are healthy.
 */
export function LowStockList({ items }: LowStockListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            All stock levels are healthy
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.product_size ? `${item.product_type} - ${item.product_size}` : item.product_type}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Threshold: {item.low_stock_threshold} {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {item.current_stock} {item.unit}
                  </span>
                  <Badge
                    variant={
                      item.status === "OUT_OF_STOCK"
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      item.status === "LOW"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : ""
                    }
                  >
                    {item.status === "OUT_OF_STOCK" ? "Out" : "Low"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
