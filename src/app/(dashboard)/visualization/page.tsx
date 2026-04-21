"use client";

import { useState } from "react";
import { ChartPickerCard } from "@/components/visualization/ChartPickerCard";
import { SalesTrendChart } from "@/components/visualization/SalesTrendChart";
import { ExpensesTrendChart } from "@/components/visualization/ExpensesTrendChart";
import { CombinedTrendChart } from "@/components/visualization/CombinedTrendChart";
import { ExpensesByCategoryChart } from "@/components/visualization/ExpensesByCategoryChart";
import { ProductRankingChart } from "@/components/visualization/ProductRankingChart";
import { InventoryLevelsChart } from "@/components/visualization/InventoryLevelsChart";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Package,
  Boxes,
  BarChart2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Chart catalogue — add or remove entries here to change the picker grid.
// Each entry maps to one chart component rendered below the grid.
// ---------------------------------------------------------------------------
const CHART_OPTIONS = [
  {
    id: "sales-trend",
    title: "Sales Trend",
    description: "Daily revenue over the last 7, 14, or 30 days",
    icon: TrendingUp,
  },
  {
    id: "expenses-trend",
    title: "Expenses Trend",
    description: "Daily spending over the last 7, 14, or 30 days",
    icon: TrendingDown,
  },
  {
    id: "combined-trend",
    title: "Sales vs Expenses",
    description: "Compare revenue and costs on the same chart",
    icon: BarChart3,
  },
  {
    id: "expenses-category",
    title: "Expenses by Category",
    description: "All-time spending broken down by category",
    icon: PieChart,
  },
  {
    id: "product-ranking",
    title: "Product Performance",
    description: "Most and least sold products by quantity",
    icon: Package,
  },
  {
    id: "inventory",
    title: "Inventory Levels",
    description: "Current stock vs low-stock threshold (top 10)",
    icon: Boxes,
  },
] as const;

type ChartId = (typeof CHART_OPTIONS)[number]["id"];

/** Renders the chart component that corresponds to the selected card. */
function ActiveChart({ id }: { id: ChartId }) {
  switch (id) {
    case "sales-trend":       return <SalesTrendChart />;
    case "expenses-trend":    return <ExpensesTrendChart />;
    case "combined-trend":    return <CombinedTrendChart />;
    case "expenses-category": return <ExpensesByCategoryChart />;
    case "product-ranking":   return <ProductRankingChart />;
    case "inventory":         return <InventoryLevelsChart />;
  }
}

export default function VisualizationPage() {
  // null = nothing selected; a chart only mounts (and fetches data) when selected.
  const [activeChart, setActiveChart] = useState<ChartId | null>(null);

  /** Toggle: clicking the active card deselects it; clicking another selects it. */
  const handleCardClick = (id: string) => {
    setActiveChart((prev) => (prev === id ? null : (id as ChartId)));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Visualization</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select a chart below to explore your data
        </p>
      </div>

      {/* Chart picker grid — 2 columns on mobile, 3 on large screens */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {CHART_OPTIONS.map((option) => (
          <ChartPickerCard
            key={option.id}
            id={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isActive={activeChart === option.id}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* Chart area — empty state or the selected chart */}
      <div className="min-h-[200px]">
        {activeChart === null ? (
          // Empty state shown when no chart is selected
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4">
              <BarChart2 className="w-7 h-7 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              No chart selected
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Pick one of the cards above to visualize your data
            </p>
          </div>
        ) : (
          // Fade-in wrapper so chart appears smoothly after selection
          <div className="animate-in fade-in duration-200">
            <ActiveChart id={activeChart} />
          </div>
        )}
      </div>
    </div>
  );
}
