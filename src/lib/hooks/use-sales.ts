"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import { getTodayRange } from "@/lib/format";
import type { Sale, PaymentType } from "@/lib/types/database";

const STALE_TIME = 30_000;

interface SalesFilters {
  from?: string;
  to?: string;
}

/**
 * Fetches sales records with optional date range filtering.
 * Each unique filter combination gets its own cache entry.
 */
export function useSales(filters?: SalesFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["sales", filters],
    staleTime: STALE_TIME,
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("*, product:products(type, size, unit), user:users!created_by(full_name)")
        .order("created_at", { ascending: false });

      if (filters?.from) query = query.gte("created_at", filters.from);
      if (filters?.to) query = query.lte("created_at", filters.to);

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
  });
}

/**
 * Returns the sum of all sales totals for today.
 * Uses `getTodayRange()` so the date boundary is consistent across hooks.
 */
export function useTodaySalesTotal() {
  const supabase = useSupabase();
  const { start, end } = getTodayRange();

  return useQuery({
    queryKey: ["sales", "today-total"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", start)
        .lte("created_at", end);

      if (error) throw error;
      return (data ?? []).reduce((sum, s) => sum + Number(s.total), 0);
    },
  });
}

interface CreateSaleInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  payment_type: PaymentType;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  created_by: string;
}

/**
 * Records a new sale and simultaneously creates a stock-out transaction,
 * then logs the sale to the audit trail.
 */
export function useCreateSale() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      // Insert the sale row first to get its ID for the stock transaction reference.
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          product_id: input.product_id,
          quantity: input.quantity,
          unit_price: input.unit_price,
          payment_type: input.payment_type,
          notes: input.notes || null,
          customer_name: input.customer_name || null,
          customer_phone: input.customer_phone || null,
          customer_address: input.customer_address || null,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Deduct inventory by creating a stock-out transaction linked to this sale.
      const { error: stockError } = await supabase
        .from("stock_transactions")
        .insert({
          product_id: input.product_id,
          type: "OUT",
          quantity: input.quantity,
          reference_type: "sale",
          reference_id: sale.id,
          notes: `Sale #${sale.id.slice(0, 8)}`,
          created_by: input.created_by,
        });

      if (stockError) throw stockError;

      await logAudit(supabase, {
        userId: input.created_by, action: "CREATE", module: "sales",
        recordId: sale.id, newValue: sale,
      });

      return sale;
    },
    onSuccess: () => {
      // Invalidate sales and inventory since stock levels changed.
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
