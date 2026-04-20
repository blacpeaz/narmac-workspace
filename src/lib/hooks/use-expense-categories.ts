"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { ExpenseCategoryRecord } from "@/lib/types/database";

export function useExpenseCategories() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as ExpenseCategoryRecord[];
    },
  });
}

export function useCreateExpenseCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("expense_categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "CREATE", module: "expense_categories",
        recordId: data.id, newValue: data,
      });

      return data as ExpenseCategoryRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: oldData } = await supabase
        .from("expense_categories").select("*").eq("id", id).single();

      const { error } = await supabase
        .from("expense_categories").delete().eq("id", id);

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "DELETE", module: "expense_categories",
        recordId: id, oldValue: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}
