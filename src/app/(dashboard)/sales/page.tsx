"use client";

import { useState } from "react";
import { useSales, useCreateSale } from "@/lib/hooks/use-sales";
import { useProducts } from "@/lib/hooks/use-products";
import { useAuth } from "@/providers/auth-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Banknote, Plus } from "lucide-react";
import { formatCurrency, SELECT_CLASS } from "@/lib/format";
import type { PaymentType } from "@/lib/types/database";
import { TableLoadingSkeleton } from "@/components/ui/table-states";

export default function SalesPage() {
  const { user, canEdit } = useAuth();

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filters = {
    ...(dateFrom && { from: `${dateFrom}T00:00:00` }),
    ...(dateTo && { to: `${dateTo}T23:59:59` }),
  };

  const { data: sales, isLoading } = useSales(
    Object.keys(filters).length > 0 ? filters : undefined
  );
  const { data: products } = useProducts();
  const createSale = useCreateSale();

  // Form state
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [showForm, setShowForm] = useState(false);

  const activeProducts = products?.filter((p) => p.is_active) ?? [];
  // Compute total live so the user sees it update as they type.
  const total = Number(quantity) * Number(unitPrice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createSale.mutateAsync({
        product_id: productId,
        quantity: Number(quantity),
        unit_price: Number(unitPrice),
        payment_type: paymentType,
        notes: notes || undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        customer_address: customerAddress || undefined,
        created_by: user.id,
      });

      toast.success("Sale recorded successfully");
      // Reset all form fields after a successful submission.
      setProductId("");
      setQuantity("");
      setUnitPrice("");
      setPaymentType("cash");
      setNotes("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record sale";
      toast.error(message);
    }
  };

  /** Returns a Tailwind class string for the payment-type badge colour. */
  const paymentBadgeColor = (type: string) => {
    switch (type) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "transfer":
        return "bg-blue-100 text-blue-800";
      case "credit":
        return "bg-orange-100 text-orange-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Record and track product sales
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Sale
          </Button>
        )}
      </div>

      {/* Sale form */}
      {showForm && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Banknote className="w-5 h-5" />
              Record a Sale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className={SELECT_CLASS}
                  required
                >
                  <option value="">Select product</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.type}{p.size ? ` - ${p.size}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className={SELECT_CLASS}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Total</Label>
                <div className="h-9 flex items-center px-3 rounded-lg border bg-[var(--muted)] font-semibold">
                  {isNaN(total) ? "0.00 Ar" : formatCurrency(total)}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 border-t pt-4 mt-2">
                <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">Customer Info (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      placeholder="Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSale.isPending || !productId || !quantity || !unitPrice}>
                  {createSale.isPending ? "Recording..." : "Record Sale"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Sales table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableLoadingSkeleton />
          ) : !sales?.length ? (
            <div className="p-12 text-center text-[var(--muted-foreground)]">
              No sales recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm">
                      {format(new Date(sale.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(sale.product as unknown as { type: string; size: string | null })?.type ?? "—"}
                      {(sale.product as unknown as { type: string; size: string | null })?.size
                        ? ` - ${(sale.product as unknown as { type: string; size: string | null }).size}`
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(sale.unit_price))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(sale.total))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={paymentBadgeColor(sale.payment_type)}>
                        {sale.payment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {sale.customer_name ? (
                        <div>
                          <span className="font-medium">{sale.customer_name}</span>
                          {sale.customer_phone && (
                            <span className="text-[var(--muted-foreground)] block text-xs">{sale.customer_phone}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted-foreground)]">
                      {(sale.user as unknown as { full_name: string })?.full_name ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
