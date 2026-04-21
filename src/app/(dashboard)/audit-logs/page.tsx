"use client";

import { useState } from "react";
import { useAuditLogs } from "@/lib/hooks/use-audit-logs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { SELECT_CLASS } from "@/lib/format";

const actionColors: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
};

export default function AuditLogsPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    module: moduleFilter || undefined,
    action: actionFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

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
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Track all create, update, and delete operations
        </p>
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
                          {log.module}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id?.slice(0, 8)}...
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${log.id}-detail`}>
                          <TableCell colSpan={6} className="bg-[var(--muted)] p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-xs text-[var(--muted-foreground)] mb-1">
                                  OLD VALUE
                                </p>
                                <pre className="bg-[var(--card)] rounded p-3 text-xs overflow-auto max-h-48 border border-[var(--border)]">
                                  {log.old_value
                                    ? JSON.stringify(log.old_value, null, 2)
                                    : "null"}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium text-xs text-[var(--muted-foreground)] mb-1">
                                  NEW VALUE
                                </p>
                                <pre className="bg-[var(--card)] rounded p-3 text-xs overflow-auto max-h-48 border border-[var(--border)]">
                                  {log.new_value
                                    ? JSON.stringify(log.new_value, null, 2)
                                    : "null"}
                                </pre>
                              </div>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] mt-3">
                              Full timestamp:{" "}
                              {format(
                                new Date(log.created_at),
                                "yyyy-MM-dd HH:mm:ss.SSS"
                              )}
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
