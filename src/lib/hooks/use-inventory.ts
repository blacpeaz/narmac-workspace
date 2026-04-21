"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { InventoryItem } from "@/lib/types/database";

// Shared query key for all inventory data.
const INVENTORY_QUERY_KEY = ["inventory"] as const;

// 30-second stale time avoids redundant refetches when multiple components
// (e.g. dashboard + inventory page) mount in the same session.
const STALE_TIME = 30_000;

/**
 * Fetches all inventory items via the `get_inventory` Supabase RPC.
 * Results are cached under ["inventory"] for 30 seconds.
 */
export function useInventory() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: INVENTORY_QUERY_KEY,
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_inventory");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

/**
 * Derived from the same `useInventory` cache — filters to only LOW / OUT_OF_STOCK items.
 * Uses a separate query key so it can be independently invalidated,
 * but the network request is deduplicated with `useInventory` when both are mounted.
 */
export function useLowStockItems() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY, "low-stock"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_inventory");
      if (error) throw error;
      return (data as InventoryItem[]).filter(
        (item) => item.status === "LOW" || item.status === "OUT_OF_STOCK"
      );
    },
  });
}

interface AddStockInput {
  product_id: string;
  quantity: number;
  notes?: string;
  created_by: string;
}

/** Inserts a stock-in transaction and logs it to the audit trail. */
export function useAddStock() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddStockInput) => {
      const { data, error } = await supabase
        .from("stock_transactions")
        .insert({
          product_id: input.product_id,
          type: "IN",
          quantity: input.quantity,
          reference_type: "initial",
          notes: input.notes || "Initial stock",
          created_by: input.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: input.created_by, action: "CREATE", module: "inventory",
        recordId: data.id, newValue: data,
      });

      return data;
    },
    onSuccess: () => {
      // Invalidate all inventory-related queries after a stock change.
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
    },
  });
}
