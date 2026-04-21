"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit, getCurrentUserId } from "@/lib/supabase/audit";
import type { ProductCategory } from "@/lib/types/database";

const STALE_TIME = 60_000; // 1 minute — categories rarely change

/** Fetches all product categories ordered alphabetically. */
export function useCategories() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["categories"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ProductCategory[];
    },
  });
}

/** Creates a product category and logs the action to the audit trail. */
export function useCreateCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const userId = await getCurrentUserId(supabase);

      const { data, error } = await supabase
        .from("product_categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "CREATE", module: "product_categories",
        recordId: data.id, newValue: data,
      });

      return data as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

/**
 * Deletes a product category.  Throws if any products are still assigned to it
 * so the UI can surface a meaningful error to the user.
 */
export function useDeleteCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCurrentUserId(supabase);

      // Guard: prevent deletion if products are still using this category.
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id);

      if (count && count > 0) {
        throw new Error("Cannot delete category — move or remove products from it first.");
      }

      // Capture the old state for the audit trail before deleting.
      const { data: oldData } = await supabase
        .from("product_categories").select("*").eq("id", id).single();

      const { error } = await supabase
        .from("product_categories").delete().eq("id", id);

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "DELETE", module: "product_categories",
        recordId: id, oldValue: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
