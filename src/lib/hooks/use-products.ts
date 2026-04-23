"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import { logAudit, getCurrentUserId } from "@/lib/supabase/audit";
import type { Product } from "@/lib/types/database";

// How long (ms) query data stays "fresh" before a background refetch is triggered.
const STALE_TIME = 30_000; // 30 seconds

// Related query keys to invalidate whenever a product mutation succeeds.
const PRODUCT_KEYS = ["products", "inventory", "audit-logs"] as const;

/** Invalidates all query keys that may be stale after a product change. */
function invalidateProductKeys(qc: ReturnType<typeof useQueryClient>) {
  PRODUCT_KEYS.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/** Fetches all products (active and inactive) ordered by type then size. */
export function useProducts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["products"],
    staleTime: STALE_TIME,
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

/** Fetches only active products. Shares stale time with the full products query. */
export function useActiveProducts() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["products", "active"],
    staleTime: STALE_TIME,
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

/** Creates a new product and writes an audit log entry. */
export function useCreateProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const userId = await getCurrentUserId(supabase);

      const { data, error } = await supabase
        .from("products")
        .insert({ ...input, created_by: userId })
        .select()
        .single();

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "CREATE", module: "products",
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

/** Updates an existing product and records the before/after values in the audit log. */
export function useUpdateProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProductInput) => {
      const userId = await getCurrentUserId(supabase);

      // Capture the old state for the audit trail.
      const { data: oldData } = await supabase
        .from("products").select("*").eq("id", input.id).single();

      const { id, ...updateData } = input;
      const { data, error } = await supabase
        .from("products").update(updateData).eq("id", id).select().single();

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "UPDATE", module: "products",
        recordId: id, oldValue: oldData, newValue: data,
      });

      return data as Product;
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}

/** Toggles a product's active/inactive status and records it in the audit log. */
export function useToggleProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const userId = await getCurrentUserId(supabase);

      // Capture the old state for the audit trail.
      const { data: oldData } = await supabase
        .from("products").select("*").eq("id", id).single();

      const { data, error } = await supabase
        .from("products").update({ is_active }).eq("id", id).select().single();

      if (error) throw error;

      await logAudit(supabase, {
        userId, action: "UPDATE", module: "products",
        recordId: id, oldValue: oldData, newValue: data,
      });

      return data as Product;
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}

/**
 * Deletes a product that has no sales or stock transaction history.
 * The DB will reject with ON DELETE RESTRICT if any history exists —
 * we catch that and surface a plain-English message.
 */
export function useDeleteProduct() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      const userId = await getCurrentUserId(supabase);

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        // Foreign key violation = product has linked sales or stock movements
        if (error.code === "23503") {
          throw new Error(
            `"${product.type}${product.size ? ` - ${product.size}` : ""}" cannot be deleted because it has sales or stock records linked to it. Deactivate it instead to hide it from the sales form.`
          );
        }
        throw new Error(error.message);
      }

      await logAudit(supabase, {
        userId, action: "DELETE", module: "products",
        recordId: product.id, oldValue: product as unknown as Record<string, unknown>,
      });
    },
    onSuccess: () => invalidateProductKeys(queryClient),
  });
}
