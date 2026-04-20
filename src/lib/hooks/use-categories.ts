"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { ProductCategory } from "@/lib/types/database";

export function useCategories() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["categories"],
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

export function useCreateCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("product_categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "CREATE", module: "product_categories",
        recordId: data.id, newValue: data,
      });

      return data as ProductCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id);

      if (count && count > 0) {
        throw new Error("Cannot delete category — move or remove products from it first.");
      }

      const { data: oldData } = await supabase
        .from("product_categories").select("*").eq("id", id).single();

      const { error } = await supabase
        .from("product_categories").delete().eq("id", id);

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "DELETE", module: "product_categories",
        recordId: id, oldValue: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
