"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types/database";

export function useProducts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("type")
        .order("size");

      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useActiveProducts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
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
  size: string;
  unit: string;
  low_stock_threshold: number;
}

export function useCreateProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "CREATE",
        module: "products",
        record_id: data.id,
        old_value: null,
        new_value: data,
      });

      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

interface UpdateProductInput {
  id: string;
  type: string;
  size: string;
  unit: string;
  low_stock_threshold: number;
}

export function useUpdateProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get old value
      const { data: oldData } = await supabase
        .from("products")
        .select("*")
        .eq("id", input.id)
        .single();

      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "UPDATE",
        module: "products",
        record_id: id,
        old_value: oldData,
        new_value: data,
      });

      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

export function useToggleProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: oldData } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        user_id: user?.id,
        action: "UPDATE",
        module: "products",
        record_id: id,
        old_value: oldData,
        new_value: data,
      });

      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
