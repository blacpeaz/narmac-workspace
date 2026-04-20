"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { Expense } from "@/lib/types/database";

interface ExpensesFilters {
  from?: string;
  to?: string;
  category?: string;
}

export function useExpenses(filters?: ExpensesFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["expenses", filters],
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

export function useTodayExpensesTotal() {
  const supabase = useSupabase();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["expenses", "today-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

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
