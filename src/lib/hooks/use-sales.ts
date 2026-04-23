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
  customer_category?: string;
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
      // Call the atomic DB function which:
      //  1. Locks the product row to serialize concurrent sales
      //  2. Checks available stock — throws if insufficient
      //  3. Inserts sale + stock-out transaction in one transaction
      const { data: sale, error: rpcError } = await supabase.rpc(
        "create_sale_safe",
        {
          p_product_id:        input.product_id,
          p_quantity:          input.quantity,
          p_unit_price:        input.unit_price,
          p_payment_type:      input.payment_type,
          p_notes:             input.notes             ?? null,
          p_customer_name:     input.customer_name     ?? null,
          p_customer_phone:    input.customer_phone    ?? null,
          p_customer_address:  input.customer_address  ?? null,
          p_customer_category: input.customer_category ?? null,
          p_created_by:        input.created_by,
        }
      );

      if (rpcError) {
        // Surface the plain-English message from the DB (e.g. "Insufficient stock...")
        throw new Error(rpcError.message);
      }

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

/**
 * Deletes a sale record and its associated OUT stock transaction so that
 * inventory is automatically restored. Intended for correcting data-entry errors.
 */
export function useDeleteSale() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: Sale) => {
      // First remove the stock-out transaction linked to this sale so stock is restored.
      const { error: txError } = await supabase
        .from("stock_transactions")
        .delete()
        .eq("reference_id", sale.id)
        .eq("type", "OUT");

      if (txError) throw txError;

      const { error } = await supabase.from("sales").delete().eq("id", sale.id);
      if (error) throw error;

      await logAudit(supabase, {
        userId: sale.created_by ?? "",
        action: "DELETE",
        module: "sales",
        recordId: sale.id,
        oldValue: sale,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
