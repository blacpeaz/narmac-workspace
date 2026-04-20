"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { InventoryItem } from "@/lib/types/database";

export function useInventory() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_inventory");
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useLowStockItems() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["inventory", "low-stock"],
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
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
    },
  });
}
