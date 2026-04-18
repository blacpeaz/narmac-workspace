"use client";

import { useInventory, useLowStockItems } from "@/lib/hooks/use-inventory";
import { useProducts } from "@/lib/hooks/use-products";
import { StatCard } from "@/components/dashboard/stat-card";
import { InventoryChart } from "@/components/dashboard/inventory-chart";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, AlertTriangle, XCircle } from "lucide-react";

export default function DashboardPage() {
  const { data: inventory, isLoading: invLoading } = useInventory();
  const { data: lowStock, isLoading: lowLoading } = useLowStockItems();
  const { data: products, isLoading: prodLoading } = useProducts();

  const isLoading = invLoading || lowLoading || prodLoading;

  const totalProducts = products?.filter((p) => p.is_active).length ?? 0;
  const lowStockCount =
    lowStock?.filter((i) => i.status === "LOW").length ?? 0;
  const outOfStockCount =
    lowStock?.filter((i) => i.status === "OUT_OF_STOCK").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Overview of your inventory and stock levels
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <StatCard
              title="Active Products"
              value={totalProducts}
              icon={Package}
              color="#1E3A8A"
            />
            <StatCard
              title="Low Stock"
              value={lowStockCount}
              icon={AlertTriangle}
              color="#F59E0B"
              subtitle="Below threshold"
            />
            <StatCard
              title="Out of Stock"
              value={outOfStockCount}
              icon={XCircle}
              color="#EF4444"
              subtitle="Zero quantity"
            />
          </>
        )}
      </div>

      {/* Charts + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {invLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <InventoryChart data={inventory ?? []} />
          )}
        </div>
        <div>
          {lowLoading ? (
            <Skeleton className="h-96" />
          ) : (
            <LowStockList items={lowStock ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}
