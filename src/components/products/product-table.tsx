"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ToggleLeft, ToggleRight, Trash2, Check, X } from "lucide-react";
import type { Product } from "@/lib/types/database";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggle: (id: string, is_active: boolean) => void;
  onDelete: (product: Product) => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (product: Product) => void;
  onCancelDelete: () => void;
  isToggling?: boolean;
  isDeleting?: boolean;
  canEdit?: boolean;
}

/** Renders the full product list in a table with edit and activate/deactivate actions. */
export function ProductTable({
  products,
  onEdit,
  onToggle,
  onDelete,
  confirmDeleteId,
  onConfirmDelete,
  onCancelDelete,
  isToggling,
  isDeleting,
  canEdit = true,
}: ProductTableProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Low Stock Threshold</TableHead>
            <TableHead>Status</TableHead>
            {canEdit && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canEdit ? 7 : 6}
                className="text-center py-8 text-[var(--muted-foreground)]">
                No products found. Add your first product to get started.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="text-sm text-[var(--muted-foreground)]">
                  {(product.category as unknown as { name: string })?.name ?? "—"}
                </TableCell>
                <TableCell className="font-medium">{product.type}</TableCell>
                <TableCell>{product.size || "—"}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-right">
                  {product.low_stock_threshold}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.is_active ? "default" : "secondary"}
                    className={
                      product.is_active
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-gray-100 text-gray-500"
                    }
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === product.id ? (
                        // Inline confirmation: green ✓ confirm, red ✗ cancel
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onConfirmDelete(product)}
                            disabled={isDeleting}
                            title="Confirm delete"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancelDelete}
                            title="Cancel"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(product)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              onToggle(product.id, !product.is_active)
                            }
                            disabled={isToggling}
                            title={
                              product.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {product.is_active ? (
                              <ToggleRight className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(product)}
                            title="Delete product"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
