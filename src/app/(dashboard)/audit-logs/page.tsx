"use client";

import { useState } from "react";
import { useAuditLogs, useDeleteAuditLog, useClearAuditLogs } from "@/lib/hooks/use-audit-logs";
import { useAuth } from "@/providers/auth-provider";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Check, ChevronDown, ChevronRight, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SELECT_CLASS } from "@/lib/format";

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
};

const MODULE_LABELS: Record<string, string> = {
  products: "Products",
  stock_transactions: "Stock",
  inventory: "Inventory",
  sales: "Sales",
  expenses: "Expenses",
  product_categories: "Categories",
};

const SKIP_KEYS = new Set(["id", "created_by", "created_at", "record_id", "updated_at"]);

/** Converts a raw DB value into a readable word. */
function humanValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "nothing";
  if (key === "is_active") return value ? "available for sale" : "no longer available for sale";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (key === "payment_type") {
    const m: Record<string, string> = { cash: "Cash", transfer: "Bank Transfer", credit: "Credit" };
    return m[String(value)] ?? String(value);
  }
  if (key === "reference_type") {
    const m: Record<string, string> = { sale: "Sale", rebaling: "Rebaling", adjustment: "Manual Adjustment", initial: "Initial Stock Entry" };
    return m[String(value)] ?? String(value);
  }
  if ((key === "unit_price" || key === "total" || key === "amount") && !isNaN(Number(value)))
    return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })} Ar`;
  if (key === "quantity" && !isNaN(Number(value))) return `${Number(value).toLocaleString()} units`;
  if (key === "low_stock_threshold" && !isNaN(Number(value))) return `${Number(value)} units`;
  return String(value);
}

/** Generates a plain-English sentence describing a single field change. */
function toSentence(key: string, oldVal: unknown, newVal: unknown, module: string): string {
  const n = humanValue(key, newVal);
  const o = humanValue(key, oldVal);

  switch (key) {
    case "is_active":
      return `This ${module.replace("_", " ")} is now ${n}.`;
    case "unit_price":
      return `The unit price was changed from ${o} to ${n}.`;
    case "total":
      return `The total amount was changed from ${o} to ${n}.`;
    case "amount":
      return `The amount was changed from ${o} to ${n}.`;
    case "quantity":
      return `The quantity was updated from ${o} to ${n}.`;
    case "low_stock_threshold":
      return `The low stock alert level was set from ${o} to ${n}.`;
    case "type":
      return `The product type was changed from "${o}" to "${n}".`;
    case "size":
      return `The size was changed from "${o}" to "${n}".`;
    case "unit":
      return `The unit of measurement was changed from "${o}" to "${n}".`;
    case "payment_type":
      return `The payment method was changed from ${o} to ${n}.`;
    case "notes":
      return `The notes were updated to: "${n}".`;
    case "description":
      return `The description was updated to: "${n}".`;
    case "category":
    case "category_id":
      return `The category was changed from "${o}" to "${n}".`;
    case "customer_name":
      return `The customer name was set to "${n}".`;
    case "customer_phone":
      return `The customer phone number was set to "${n}".`;
    case "customer_address":
      return `The customer address was set to "${n}".`;
    case "name":
      return `The name was changed from "${o}" to "${n}".`;
    default:
      return `"${key}" was changed from "${o}" to "${n}".`;
  }
}

/** Generates a plain-English sentence for a created or deleted record field. */
function toCreateSentence(key: string, value: unknown, module: string): string {
  const v = humanValue(key, value);
  const mod = module.replace("_", " ");
  switch (key) {
    case "type": return `Product type: "${v}"`;
    case "size": return value ? `Size: "${v}"` : `No size specified`;
    case "unit": return `Measured in: ${v}`;
    case "is_active": return `Status: This ${mod} is ${v}`;
    case "low_stock_threshold": return `Low stock alert: will trigger below ${v}`;
    case "quantity": return `Quantity: ${v}`;
    case "unit_price": return `Unit price: ${v}`;
    case "total": return `Total amount: ${v}`;
    case "amount": return `Amount: ${v}`;
    case "payment_type": return `Payment method: ${v}`;
    case "category": return `Category: ${v}`;
    case "notes": return value ? `Notes: "${v}"` : "";
    case "description": return value ? `Description: "${v}"` : "";
    case "customer_name": return value ? `Customer: ${v}` : "";
    case "customer_phone": return value ? `Phone: ${v}` : "";
    case "customer_address": return value ? `Address: ${v}` : "";
    case "name": return `Name: "${v}"`;
    default: return "";
  }
}

function AuditDiffView({
  action,
  module,
  oldValue,
  newValue,
}: {
  action: string;
  module: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
}) {
  if (action === "UPDATE" && oldValue && newValue) {
    const changedKeys = Object.keys(newValue).filter(
      (k) => !SKIP_KEYS.has(k) && JSON.stringify(oldValue[k]) !== JSON.stringify(newValue[k])
    );
    if (changedKeys.length === 0)
      return <p className="text-sm text-[var(--muted-foreground)] italic">Nothing was changed.</p>;
    return (
      <div className="space-y-2">
        {changedKeys.map((key) => (
          <div key={key} className="flex items-start gap-3 rounded-lg bg-[var(--card)] border border-[var(--border)] px-4 py-3 text-sm">
            <span className="text-base mt-0.5">✏️</span>
            <span className="text-[var(--foreground)]">{toSentence(key, oldValue[key], newValue[key], module)}</span>
          </div>
        ))}
      </div>
    );
  }

  const data = newValue ?? oldValue;
  if (!data)
    return <p className="text-sm text-[var(--muted-foreground)] italic">No details available.</p>;

  const isCreate = action === "CREATE";
  const visibleKeys = Object.keys(data).filter((k) => !SKIP_KEYS.has(k));
  const lines = visibleKeys.map((k) => toCreateSentence(k, data[k], module)).filter(Boolean);

  return (
    <div className="space-y-2">
      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
        isCreate
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300"
          : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300"
      }`}>
        <span className="text-base">{isCreate ? "✅" : "🗑️"}</span>
        <span>
          {isCreate
            ? `A new ${MODULE_LABELS[module]?.toLowerCase().replace(/s$/, "") ?? module} was added.`
            : `A ${MODULE_LABELS[module]?.toLowerCase().replace(/s$/, "") ?? module} record was deleted.`}
        </span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg bg-[var(--card)] border border-[var(--border)] px-4 py-2.5 text-sm">
          <span className="text-base mt-0.5">•</span>
          <span className="text-[var(--foreground)]">{line}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    module: moduleFilter || undefined,
    action: actionFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const deleteLog = useDeleteAuditLog();
  const clearLogs = useClearAuditLogs();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLog.mutate(id, {
      onSuccess: () => { toast.success("Log entry deleted."); setConfirmDeleteId(null); },
      onError: () => { toast.error("Failed to delete. Check Supabase RLS policies."); setConfirmDeleteId(null); },
    });
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleClearAll = () => {
    clearLogs.mutate(undefined, {
      onSuccess: () => { toast.success("All audit logs cleared."); setConfirmClear(false); },
      onError: () => { toast.error("Failed to clear logs."); setConfirmClear(false); },
    });
  };

  if (authLoading) {
    return <Skeleton className="h-96" />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Only admins can view audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Track all create, update, and delete operations
          </p>
        </div>
        {!confirmClear ? (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Logs
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            <span className="text-sm text-red-700 dark:text-red-300">Delete all logs permanently?</span>
            <Button size="sm" variant="destructive" onClick={handleClearAll} disabled={clearLogs.isPending}>
              {clearLogs.isPending ? "Clearing..." : "Yes, delete all"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Module</Label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className={`h-9 w-40 ${SELECT_CLASS}`}
          >
            <option value="">All modules</option>
            <option value="products">Products</option>
            <option value="stock_transactions">Stock</option>
            <option value="inventory">Inventory</option>
            <option value="sales">Sales</option>
            <option value="expenses">Expenses</option>
            <option value="product_categories">Categories</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action</Label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={`h-9 w-36 ${SELECT_CLASS}`}
          >
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>

                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(logs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-[var(--muted-foreground)]"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                (logs ?? []).map((log) => {
                  const isExpanded = expandedRow === log.id;
                  const userName =
                    (log.user as unknown as { full_name: string; email: string })
                      ?.full_name ||
                    (log.user as unknown as { full_name: string; email: string })
                      ?.email ||
                    "System";
                  return (
                    <>
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-[var(--muted)]"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : log.id)
                        }
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(log.created_at),
                            "MMM d, yyyy HH:mm"
                          )}
                        </TableCell>
                        <TableCell>{userName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              actionColors[log.action] || ""
                            }
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {MODULE_LABELS[log.module] ?? log.module}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[var(--muted-foreground)]">
                          {log.record_id?.slice(0, 8)}…
                        </TableCell>
                        <TableCell>
                          {confirmDeleteId === log.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleConfirmDelete(log.id, e)}
                                disabled={deleteLog.isPending}
                                className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 transition-colors"
                                title="Confirm delete"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                className="p-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => handleDeleteClick(log.id, e)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
                              title="Delete this log entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-detail`}>
                          <TableCell colSpan={6} className="bg-[var(--muted)]/50 px-6 py-4">
                            <AuditDiffView
                              action={log.action}
                              module={log.module}
                              oldValue={log.old_value as Record<string, unknown> | null}
                              newValue={log.new_value as Record<string, unknown> | null}
                            />
                            <p className="text-xs text-[var(--muted-foreground)] mt-3">
                              {format(new Date(log.created_at), "MMMM d, yyyy 'at' HH:mm:ss")}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
