"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";

export interface DailyTotal {
  date: string;
  total: number;
}

export interface TopProduct {
  product_type: string;
  product_size: string | null;
  total_quantity: number;
  total_revenue: number;
}

/** Group rows by date into a { date, total } array, pre-filling missing days with 0. */
function groupByDate(
  rows: { created_at: string; value: number }[],
  from: Date,
  days: number,
): DailyTotal[] {
  const grouped: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    grouped[d.toISOString().split("T")[0]] = 0;
  }
  for (const r of rows) {
    const date = new Date(r.created_at).toISOString().split("T")[0];
    grouped[date] = (grouped[date] ?? 0) + r.value;
  }
  return Object.entries(grouped).map(([date, total]) => ({ date, total }));
}

export function useSalesTrend(days: number = 7) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["sales-trend", days],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - days + 1);
      from.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("sales")
        .select("created_at, total")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return groupByDate(
        (data ?? []).map((s) => ({ created_at: s.created_at, value: Number(s.total) })),
        from, days,
      );
    },
  });
}

export function useExpensesTrend(days: number = 7) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expenses-trend", days],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - days + 1);
      from.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("expenses")
        .select("created_at, amount")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return groupByDate(
        (data ?? []).map((e) => ({ created_at: e.created_at, value: Number(e.amount) })),
        from, days,
      );
    },
  });
}

export function useExpensesByCategory() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expenses-by-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("category, amount");

      if (error) throw error;

      const grouped: Record<string, number> = {};
      for (const exp of data ?? []) {
        grouped[exp.category] = (grouped[exp.category] ?? 0) + Number(exp.amount);
      }

      return Object.entries(grouped)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

export function useTopProducts(limit: number = 5) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["top-products", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("quantity, total, product:products(type, size)");

      if (error) throw error;

      const grouped: Record<string, { qty: number; revenue: number; type: string; size: string | null }> = {};
      for (const sale of data ?? []) {
        const product = sale.product as unknown as { type: string; size: string | null } | null;
        if (!product) continue;
        const key = `${product.type}||${product.size ?? ""}`;
        if (!grouped[key]) {
          grouped[key] = { qty: 0, revenue: 0, type: product.type, size: product.size };
        }
        grouped[key].qty += Number(sale.quantity);
        grouped[key].revenue += Number(sale.total);
      }

      const sorted = Object.values(grouped).sort((a, b) => b.qty - a.qty);
      const toProduct = (p: typeof sorted[number]): TopProduct => ({
        product_type: p.type,
        product_size: p.size,
        total_quantity: p.qty,
        total_revenue: p.revenue,
      });

      return {
        top: sorted.slice(0, limit).map(toProduct),
        bottom: [...sorted].reverse().slice(0, limit).map(toProduct),
      };
    },
  });
}
