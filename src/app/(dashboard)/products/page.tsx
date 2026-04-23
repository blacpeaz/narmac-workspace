"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useToggleProduct,
  useDeleteProduct,
} from "@/lib/hooks/use-products";
import { ProductTable } from "@/components/products/product-table";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCategories, useDeleteCategory } from "@/lib/hooks/use-categories";
import type { Product } from "@/lib/types/database";

export default function ProductsPage() {
  const { isAdmin, canEdit, isLoading: authLoading } = useAuth();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const toggleProduct = useToggleProduct();
  const deleteProduct = useDeleteProduct();
  const { data: categories } = useCategories();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (authLoading) {
    return <Skeleton className="h-96" />;
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

  const handleDeleteClick = (product: Product) => {
    setConfirmDeleteId(product.id);
  };

  const handleConfirmDelete = (product: Product) => {
    deleteProduct.mutate(product, {
      onSuccess: () => {
        toast.success("Product deleted");
        setConfirmDeleteId(null);
      },
      onError: (err) => {
        toast.error(err.message);
        setConfirmDeleteId(null);
      },
    });
  };

  const handleCancelDelete = () => setConfirmDeleteId(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your product catalog
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <ProductTable
          products={products ?? []}
          onEdit={(product) => setEditingProduct(product)}
          onToggle={handleToggle}
          onDelete={handleDeleteClick}
          confirmDeleteId={confirmDeleteId}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          isToggling={toggleProduct.isPending}
          isDeleting={deleteProduct.isPending}
          canEdit={canEdit}
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
                {canEdit && (
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="ml-1 hover:text-red-600 transition-colors"
                    title={`Delete ${c.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
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
      {canEdit && (
        <ProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreate}
          isLoading={createProduct.isPending}
        />
      )}

      {/* Edit dialog */}
      {canEdit && (
        <ProductDialog
          open={!!editingProduct}
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct}
          onSubmit={handleUpdate}
          isLoading={updateProduct.isPending}
        />
      )}
    </div>
  );
}
