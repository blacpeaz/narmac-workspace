"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "@/lib/types/database";

export function useInventory() {
  const supabase = createClient();

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
  const supabase = createClient();

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
