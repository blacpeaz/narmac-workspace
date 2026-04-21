"use client";

import { useInventory } from "@/lib/hooks/use-inventory";
import { InventoryChart } from "@/components/dashboard/inventory-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Wraps the shared InventoryChart component with its own data hook.
 * Shows the top 10 products by current stock level vs their threshold.
 */
export function InventoryLevelsChart() {
  const { data: inventory, isLoading } = useInventory();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Inventory Levels — Top 10</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : (
          <InventoryChart data={inventory ?? []} />
        )}
      </CardContent>
    </Card>
  );
}
