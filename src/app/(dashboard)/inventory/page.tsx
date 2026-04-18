"use client";

import { useState } from "react";
import { useInventory } from "@/lib/hooks/use-inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const statusConfig = {
  OK: {
    label: "OK",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  LOW: {
    label: "Low",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  OUT_OF_STOCK: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export default function InventoryPage() {
  const { data: inventory, isLoading } = useInventory();
  const [search, setSearch] = useState("");

  const filtered = (inventory ?? []).filter(
    (item) =>
      item.product_type.toLowerCase().includes(search.toLowerCase()) ||
      item.product_size.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Real-time calculated stock levels (read-only)
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search by product type or size..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-[var(--muted-foreground)]"
                  >
                    {search
                      ? "No matching inventory items"
                      : "No inventory data. Add products and stock transactions to see data here."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const config =
                    statusConfig[item.status] || statusConfig.OK;
                  return (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">
                        {item.product_type}
                      </TableCell>
                      <TableCell>{item.product_size}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.current_stock}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.low_stock_threshold}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={config.className}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
