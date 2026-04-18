"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useToggleProduct,
} from "@/lib/hooks/use-products";
import { ProductTable } from "@/components/products/product-table";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types/database";

export default function ProductsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const toggleProduct = useToggleProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  if (authLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Only admins can manage products.
        </p>
      </div>
    );
  }

  const handleCreate = (data: {
    type: string;
    size: string;
    unit: string;
    low_stock_threshold: number;
  }) => {
    createProduct.mutate(data, {
      onSuccess: () => {
        toast.success("Product created successfully");
        setDialogOpen(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to create product");
      },
    });
  };

  const handleUpdate = (data: {
    type: string;
    size: string;
    unit: string;
    low_stock_threshold: number;
  }) => {
    if (!editingProduct) return;
    updateProduct.mutate(
      { id: editingProduct.id, ...data },
      {
        onSuccess: () => {
          toast.success("Product updated successfully");
          setEditingProduct(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update product");
        },
      }
    );
  };

  const handleToggle = (id: string, is_active: boolean) => {
    toggleProduct.mutate(
      { id, is_active },
      {
        onSuccess: () => {
          toast.success(
            is_active ? "Product activated" : "Product deactivated"
          );
        },
        onError: (err) => {
          toast.error(err.message || "Failed to toggle product");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your product catalog (type + size)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <ProductTable
          products={products ?? []}
          onEdit={(product) => setEditingProduct(product)}
          onToggle={handleToggle}
          isToggling={toggleProduct.isPending}
        />
      )}

      {/* Create dialog */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        isLoading={createProduct.isPending}
      />

      {/* Edit dialog */}
      <ProductDialog
        open={!!editingProduct}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSubmit={handleUpdate}
        isLoading={updateProduct.isPending}
      />
    </div>
  );
}
