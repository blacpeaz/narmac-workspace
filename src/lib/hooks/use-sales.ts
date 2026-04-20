"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { Sale, PaymentType } from "@/lib/types/database";

interface SalesFilters {
  from?: string;
  to?: string;
}

export function useSales(filters?: SalesFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["sales", filters],
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

export function useTodaySalesTotal() {
  const supabase = useSupabase();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["sales", "today-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

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
  created_by: string;
}

export function useCreateSale() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          product_id: input.product_id,
          quantity: input.quantity,
          unit_price: input.unit_price,
          payment_type: input.payment_type,
          notes: input.notes || null,
          customer_name: input.customer_name || null,
          customer_phone: input.customer_phone || null,
          customer_address: input.customer_address || null,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const { error: stockError } = await supabase
        .from("stock_transactions")
        .insert({
          product_id: input.product_id,
          type: "OUT",
          quantity: input.quantity,
          reference_type: "sale",
          reference_id: sale.id,
          notes: `Sale #${sale.id.slice(0, 8)}`,
          created_by: input.created_by,
        });

      if (stockError) throw stockError;

      await logAudit(supabase, {
        userId: input.created_by, action: "CREATE", module: "sales",
        recordId: sale.id, newValue: sale,
      });

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock"] });
    },
  });
}
