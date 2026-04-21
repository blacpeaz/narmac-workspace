"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit, getCurrentUserId } from "@/lib/supabase/audit";
import type { ExpenseCategoryRecord } from "@/lib/types/database";

const STALE_TIME = 60_000; // 1 minute — categories rarely change

/** Fetches all expense categories ordered alphabetically. */
export function useExpenseCategories() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expense-categories"],
    staleTime: STALE_TIME,
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

/** Creates an expense category and logs the action to the audit trail. */
export function useCreateExpenseCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const userId = await getCurrentUserId(supabase);

      const { data, error } = await supabase
        .from("expense_categories")
        .insert({ name: name.trim() })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "CREATE", module: "expense_categories",
        recordId: data.id, newValue: data,
      });

      return data as ExpenseCategoryRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

/** Deletes an expense category and records the deletion in the audit trail. */
export function useDeleteExpenseCategory() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const userId = await getCurrentUserId(supabase);

      // Capture the old state for the audit trail before deleting.
      const { data: oldData } = await supabase
        .from("expense_categories").select("*").eq("id", id).single();

      const { error } = await supabase
        .from("expense_categories").delete().eq("id", id);

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "DELETE", module: "expense_categories",
        recordId: id, oldValue: oldData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}
