"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useCreateCategory } from "@/lib/hooks/use-categories";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types/database";
import { SELECT_CLASS } from "@/lib/format";

const UNIT_OPTIONS = ["kg", "pcs", "bags", "rolls", "liters", "meters"];

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: {
    type: string;
    size: string | null;
    unit: string;
    low_stock_threshold: number;
    category_id: string | null;
  }) => void;
  isLoading?: boolean;
}

/**
 * Modal dialog for creating or editing a product.
 * When `product` is provided the form pre-fills with its values (edit mode);
 * otherwise it starts blank (create mode).
 */
export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading,
}: ProductDialogProps) {
  const [type, setType] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("kg");
  const [threshold, setThreshold] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();

  useEffect(() => {
    if (product) {
      setType(product.type);
      setSize(product.size ?? "");
      setUnit(product.unit);
      setThreshold(String(product.low_stock_threshold));
      setCategoryId(product.category_id ?? "");
    } else {
      setType("");
      setSize("");
      setUnit("kg");
      setThreshold("0");
      setCategoryId("");
    }
    setShowNewCategory(false);
    setNewCategoryName("");
  }, [product, open]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory.mutateAsync(newCategoryName.trim());
      setCategoryId(cat.id);
      setNewCategoryName("");
      setShowNewCategory(false);
      toast.success(`Category "${cat.name}" created`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      toast.error(message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: type.trim(),
      size: size.trim() || null,
      unit,
      low_stock_threshold: Number(threshold),
      category_id: categoryId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            {showNewCategory ? (
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={createCategory.isPending || !newCategoryName.trim()}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={`flex-1 ${SELECT_CLASS}`}
                >
                  <option value="">No category</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setShowNewCategory(true)}
                  title="New category"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type / Name</Label>
            <Input
              id="type"
              placeholder="e.g. D100, Pressing Iron"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (optional)</Label>
            <Input
              id="size"
              placeholder="e.g. 80kg, 40kg, LOOSE"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={SELECT_CLASS}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : product
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
