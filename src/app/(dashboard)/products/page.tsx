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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShieldAlert, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCategories, useDeleteCategory } from "@/lib/hooks/use-categories";
import type { Product } from "@/lib/types/database";

export default function ProductsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const toggleProduct = useToggleProduct();
  const { data: categories } = useCategories();
  const deleteCategory = useDeleteCategory();

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

  const handleDeleteCategory = (id: string, name: string) => {
    deleteCategory.mutate(id, {
      onSuccess: () => toast.success(`Category "${name}" deleted`),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleCreate = (data: {
    type: string;
    size: string | null;
    unit: string;
    low_stock_threshold: number;
    category_id: string | null;
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
    size: string | null;
    unit: string;
    low_stock_threshold: number;
    category_id: string | null;
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
            Manage your product catalog
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

      {/* Manage Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="w-4 h-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(categories ?? []).map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                {c.name}
                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="ml-1 hover:text-red-600 transition-colors"
                  title={`Delete ${c.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(!categories || categories.length === 0) && (
              <p className="text-sm text-[var(--muted-foreground)]">
                No categories yet. Create one when adding a product.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
