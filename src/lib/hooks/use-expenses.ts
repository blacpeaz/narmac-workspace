"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import { getTodayRange } from "@/lib/format";
import type { Expense } from "@/lib/types/database";

const STALE_TIME = 30_000;

interface ExpensesFilters {
  from?: string;
  to?: string;
  category?: string;
}

/**
 * Fetches expense records with optional date range and category filtering.
 * Each unique filter combination gets its own cache entry.
 */
export function useExpenses(filters?: ExpensesFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expenses", filters],
    staleTime: STALE_TIME,
    queryFn: async () => {
      let query = supabase
        .from("expenses")
        .select("*, user:users!created_by(full_name)")
        .order("created_at", { ascending: false });

      if (filters?.from) query = query.gte("created_at", filters.from);
      if (filters?.to) query = query.lte("created_at", filters.to);
      if (filters?.category) query = query.eq("category", filters.category);

      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

/**
 * Returns the sum of all expense amounts for today.
 * Uses `getTodayRange()` so the date boundary is consistent with `useTodaySalesTotal`.
 */
export function useTodayExpensesTotal() {
  const supabase = useSupabase();
  const { start, end } = getTodayRange();

  return useQuery({
    queryKey: ["expenses", "today-total"],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("created_at", start)
        .lte("created_at", end);

      if (error) throw error;
      return (data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    },
  });
}

interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  created_by: string;
}

/** Creates a new expense record and writes an audit log entry. */
export function useCreateExpense() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          category: input.category,
          amount: input.amount,
          description: input.description || null,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      await logAudit(supabase, {
        userId: input.created_by, action: "CREATE", module: "expenses",
        recordId: expense.id, newValue: expense,
      });

      return expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

/** Deletes an expense record. Intended for correcting data-entry errors. */
export function useDeleteExpense() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Expense) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
      if (error) throw error;

      await logAudit(supabase, {
        userId: expense.created_by ?? "",
        action: "DELETE",
        module: "expenses",
        recordId: expense.id,
        oldValue: expense,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
