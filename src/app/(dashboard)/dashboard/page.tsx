"use client";

import { useLowStockItems } from "@/lib/hooks/use-inventory";
import { useProducts } from "@/lib/hooks/use-products";
import { useTodaySalesTotal } from "@/lib/hooks/use-sales";
import { useTodayExpensesTotal } from "@/lib/hooks/use-expenses";
import { StatCard } from "@/components/dashboard/stat-card";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  Banknote,
  Receipt,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const { data: lowStock, isLoading: lowLoading, isError: lowError } = useLowStockItems();
  const { data: products, isLoading: prodLoading, isError: prodError } = useProducts();
  const { data: todaySales, isLoading: salesLoading, isError: salesError } = useTodaySalesTotal();
  const { data: todayExpenses, isLoading: expensesLoading, isError: expensesError } = useTodayExpensesTotal();

  // After 10 s, stop showing skeletons regardless — prevents infinite loading
  // when Supabase free-tier project is waking up from sleep.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(t);
  }, []);

  // Show loading skeletons only while fetching — errors or timeout resolve it.
  const isLoading = !timedOut && (
    (lowLoading && !lowError) || (prodLoading && !prodError) ||
    (salesLoading && !salesError) || (expensesLoading && !expensesError)
  );

  // Derived stat values computed from the query results.
  const totalProducts = products?.filter((p) => p.is_active).length ?? 0;
  const lowStockCount =
    lowStock?.filter((i) => i.status === "LOW").length ?? 0;
  const outOfStockCount =
    lowStock?.filter((i) => i.status === "OUT_OF_STOCK").length ?? 0;
  const netBalance = (todaySales ?? 0) - (todayExpenses ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Overview of your inventory, sales, and expenses
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
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
              color="#6366F1"
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
            <StatCard
              title="Sales Today"
              value={todaySales ?? 0}
              icon={Banknote}
              color="#10B981"
              isCurrency
            />
            <StatCard
              title="Expenses Today"
              value={todayExpenses ?? 0}
              icon={Receipt}
              color="#EF4444"
              isCurrency
            />
            <StatCard
              title="Net Balance"
              value={netBalance}
              icon={TrendingUp}
              color={netBalance >= 0 ? "#10B981" : "#EF4444"}
              subtitle="Sales - Expenses"
              isCurrency
            />
          </>
        )}
      </div>

      {/* Low Stock Alerts */}
      {lowLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <LowStockList items={lowStock ?? []} />
      )}
    </div>
  );
}
