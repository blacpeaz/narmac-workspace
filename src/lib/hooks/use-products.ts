"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit } from "@/lib/supabase/audit";
import type { Product } from "@/lib/types/database";

const PRODUCT_KEYS = ["products", "inventory", "audit-logs"] as const;

function invalidateProductKeys(qc: ReturnType<typeof useQueryClient>) {
  PRODUCT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useProducts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:product_categories(id, name)")
        .order("type")
        .order("size");

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useActiveProducts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:product_categories(id, name)")
        .eq("is_active", true)
        .order("type")
        .order("size");

      if (error) throw error;
      return data as Product[];
    },
  });
}

interface CreateProductInput {
  type: string;
  size: string | null;
  unit: string;
  low_stock_threshold: number;
  category_id: string | null;
}

export function useCreateProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("products")
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "CREATE", module: "products",
        recordId: data.id, newValue: data,
      });

      return data as Product;
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}

interface UpdateProductInput {
  id: string;
  type: string;
  size: string | null;
  unit: string;
  low_stock_threshold: number;
  category_id: string | null;
}

export function useUpdateProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: oldData } = await supabase
        .from("products").select("*").eq("id", input.id).single();

      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from("products").update(updateData).eq("id", id).select().single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "UPDATE", module: "products",
        recordId: id, oldValue: oldData, newValue: data,
      });

      return data as Product;
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}

export function useToggleProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: oldData } = await supabase
        .from("products").select("*").eq("id", id).single();

      const { data, error } = await supabase
        .from("products").update({ is_active }).eq("id", id).select().single();

      if (error) throw error;

      await logAudit(supabase, {
        userId: user?.id, action: "UPDATE", module: "products",
        recordId: id, oldValue: oldData, newValue: data,
      });

      return data as Product;
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}
