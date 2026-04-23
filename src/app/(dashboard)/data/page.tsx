"use client";

import { useRef, useState } from "react";
import { useSales } from "@/lib/hooks/use-sales";
import { useExpenses } from "@/lib/hooks/use-expenses";
import { useInventory } from "@/lib/hooks/use-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  FileText,
  Contact,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\r\n");
}

function toExcel(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/** Build a vCard 3.0 string for a single contact. */
function toVCard(name: string, phone: string, address?: string): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${name};;;`,
    `TEL;TYPE=CELL:${phone}`,
  ];
  if (address) lines.push(`ADR;TYPE=HOME:;;${address};;;;`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ExportCard({
  title,
  description,
  icon: Icon,
  count,
  onCSV,
  onExcel,
  onVCF,
  isLoading,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
  onCSV: () => void;
  onExcel?: () => void;
  onVCF?: () => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p>{title}</p>
            <p className="text-sm font-normal text-[var(--muted-foreground)]">{description}</p>
          </div>
          {!isLoading && (
            <Badge variant="secondary" className="ml-auto">
              {count} {count === 1 ? "record" : "records"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : count === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No data available to export.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onCSV}>
              <FileText className="w-4 h-4 mr-2" />
              CSV
            </Button>
            {onExcel && (
              <Button variant="outline" size="sm" onClick={onExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </Button>
            )}
            {onVCF && (
              <Button variant="outline" size="sm" onClick={onVCF}>
                <Contact className="w-4 h-4 mr-2" />
                VCF (Contacts)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DataPage() {
  const { data: sales, isLoading: salesLoading } = useSales();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  // ── Build export rows ───────────────────────────────────────────────────

  const salesRows = (sales ?? []).map((s) => {
    const p = s.product as unknown as { type: string; size: string | null } | undefined;
    return {
      Date: format(new Date(s.created_at), "MMM d, yyyy"),
      Product: p ? (p.size ? `${p.type} - ${p.size}` : p.type) : "—",
      Quantity: s.quantity,
      "Unit Price (Ar)": Number(s.unit_price),
      "Total (Ar)": Number(s.total),
      Payment: s.payment_type,
      "Customer Name": s.customer_name ?? "",
      "Customer Phone": s.customer_phone ?? "",
      "Customer Address": s.customer_address ?? "",
      Notes: s.notes ?? "",
      "Recorded By": (s.user as unknown as { full_name: string } | undefined)?.full_name ?? "",
    };
  });

  const expenseRows = (expenses ?? []).map((e) => ({
    Date: format(new Date(e.created_at), "MMM d, yyyy"),
    Category: e.category,
    "Amount (Ar)": Number(e.amount),
    Description: e.description ?? "",
    "Recorded By": (e.user as unknown as { full_name: string } | undefined)?.full_name ?? "",
  }));

  const inventoryRows = (inventory ?? []).map((i) => ({
    Product: i.product_size ? `${i.product_type} - ${i.product_size}` : i.product_type,
    Unit: i.unit,
    "Current Stock": i.current_stock,
    "Low Stock Threshold": i.low_stock_threshold,
    Status: i.status,
  }));

  // Unique customers from sales that have a name or phone
  const customerRows = (sales ?? [])
    .filter((s) => s.customer_name || s.customer_phone)
    .reduce<{ name: string; phone: string; address: string; category: string }[]>((acc, s) => {
      const key = `${s.customer_name ?? ""}|${s.customer_phone ?? ""}`;
      if (!acc.find((c) => `${c.name}|${c.phone}` === key)) {
        acc.push({
          name: s.customer_name ?? "",
          phone: s.customer_phone ?? "",
          address: s.customer_address ?? "",
          category: (s as unknown as { customer_category: string | null }).customer_category ?? "",
        });
      }
      return acc;
    }, []);

  const balesCustomers = customerRows.filter((c) => c.category === "Bales");
  const householdCustomers = customerRows.filter((c) => c.category === "Household items");

  // ── Export handlers ─────────────────────────────────────────────────────

  const exportSalesCSV = () => {
    downloadBlob(new Blob([toCSV(salesRows)], { type: "text/csv" }), "narmac_sales.csv");
    toast.success("Sales exported as CSV");
  };
  const exportSalesExcel = () => {
    toExcel(salesRows, "Sales", "narmac_sales.xlsx");
    toast.success("Sales exported as Excel");
  };

  const exportExpensesCSV = () => {
    downloadBlob(new Blob([toCSV(expenseRows)], { type: "text/csv" }), "narmac_expenses.csv");
    toast.success("Expenses exported as CSV");
  };
  const exportExpensesExcel = () => {
    toExcel(expenseRows, "Expenses", "narmac_expenses.xlsx");
    toast.success("Expenses exported as Excel");
  };

  const exportInventoryCSV = () => {
    downloadBlob(new Blob([toCSV(inventoryRows)], { type: "text/csv" }), "narmac_inventory.csv");
    toast.success("Inventory exported as CSV");
  };
  const exportInventoryExcel = () => {
    toExcel(inventoryRows, "Inventory", "narmac_inventory.xlsx");
    toast.success("Inventory exported as Excel");
  };

  const exportCustomersCSV = () => {
    const rows = customerRows.map((c) => ({ Name: c.name, Phone: c.phone, Address: c.address, Category: c.category }));
    downloadBlob(new Blob([toCSV(rows)], { type: "text/csv" }), "narmac_customers_all.csv");
    toast.success("All customers exported as CSV");
  };

  const exportCustomersVCF = () => {
    const vcf = customerRows
      .filter((c) => c.phone)
      .map((c) => toVCard(c.name || c.phone, c.phone, c.address || undefined))
      .join("\r\n");
    downloadBlob(new Blob([vcf], { type: "text/vcard" }), "narmac_customers_all.vcf");
    toast.success(`${customerRows.filter((c) => c.phone).length} contacts exported as VCF`);
  };

  const exportBalesCSV = () => {
    const rows = balesCustomers.map((c) => ({ Name: c.name, Phone: c.phone, Address: c.address }));
    downloadBlob(new Blob([toCSV(rows)], { type: "text/csv" }), "narmac_customers_bales.csv");
    toast.success("Bales customers exported as CSV");
  };
  const exportBalesVCF = () => {
    const vcf = balesCustomers
      .filter((c) => c.phone)
      .map((c) => toVCard(c.name || c.phone, c.phone, c.address || undefined))
      .join("\r\n");
    downloadBlob(new Blob([vcf], { type: "text/vcard" }), "narmac_customers_bales.vcf");
    toast.success(`${balesCustomers.filter((c) => c.phone).length} Bales contacts exported as VCF`);
  };

  const exportHouseholdCSV = () => {
    const rows = householdCustomers.map((c) => ({ Name: c.name, Phone: c.phone, Address: c.address }));
    downloadBlob(new Blob([toCSV(rows)], { type: "text/csv" }), "narmac_customers_household.csv");
    toast.success("Household customers exported as CSV");
  };
  const exportHouseholdVCF = () => {
    const vcf = householdCustomers
      .filter((c) => c.phone)
      .map((c) => toVCard(c.name || c.phone, c.phone, c.address || undefined))
      .join("\r\n");
    downloadBlob(new Blob([vcf], { type: "text/vcard" }), "narmac_customers_household.vcf");
    toast.success(`${householdCustomers.filter((c) => c.phone).length} Household contacts exported as VCF`);
  };

  // ── Import handler ──────────────────────────────────────────────────────

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "vcf") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const cards = text.split(/BEGIN:VCARD/i).filter(Boolean);
        const errors: string[] = [];
        let success = 0;

        const contacts = cards.map((card, i) => {
          const fn = card.match(/FN:(.*)/i)?.[1]?.trim() ?? "";
          const tel = card.match(/TEL[^:]*:(.*)/i)?.[1]?.trim() ?? "";
          if (!tel) { errors.push(`Card ${i + 1}: no phone number found`); return null; }
          success++;
          return { name: fn, phone: tel };
        }).filter(Boolean);

        // Download a preview CSV of what was parsed
        if (contacts.length) {
          const rows = contacts.map((c) => ({ Name: c!.name, Phone: c!.phone }));
          downloadBlob(new Blob([toCSV(rows)], { type: "text/csv" }), "imported_contacts_preview.csv");
        }
        setImportResult({ success, errors });
      };
      reader.readAsText(file);
    } else if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) { setImportResult({ success: 0, errors: ["File appears empty."] }); return; }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
        const errors: string[] = [];
        let success = 0;

        lines.slice(1).forEach((line, i) => {
          const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = vals[idx] ?? ""; });
          const phone = row["phone"] ?? row["customer phone"] ?? row["tel"] ?? "";
          if (!phone) { errors.push(`Row ${i + 2}: no phone number`); return; }
          success++;
        });

        setImportResult({ success, errors });
        toast.success(`Parsed ${success} contacts from CSV`);
      };
      reader.readAsText(file);
    } else {
      toast.error("Unsupported file type. Please use .csv or .vcf");
    }

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Data</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Export your data in popular formats or import customer contacts
        </p>
      </div>

      {/* ── Export ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">Export</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExportCard
            title="Sales"
            description="All sales records with customer info"
            icon={FileSpreadsheet}
            count={salesRows.length}
            isLoading={salesLoading}
            onCSV={exportSalesCSV}
            onExcel={exportSalesExcel}
          />
          <ExportCard
            title="Expenses"
            description="All expense records by category"
            icon={FileSpreadsheet}
            count={expenseRows.length}
            isLoading={expensesLoading}
            onCSV={exportExpensesCSV}
            onExcel={exportExpensesExcel}
          />
          <ExportCard
            title="Inventory"
            description="Current stock levels for all products"
            icon={FileSpreadsheet}
            count={inventoryRows.length}
            isLoading={inventoryLoading}
            onCSV={exportInventoryCSV}
            onExcel={exportInventoryExcel}
          />
          <ExportCard
            title="Customers — All"
            description="Every unique customer across all sales"
            icon={Contact}
            count={customerRows.length}
            isLoading={salesLoading}
            onCSV={exportCustomersCSV}
            onVCF={exportCustomersVCF}
          />
          <ExportCard
            title="Customers — Bales"
            description="Customers categorised as Bales buyers"
            icon={Contact}
            count={balesCustomers.length}
            isLoading={salesLoading}
            onCSV={exportBalesCSV}
            onVCF={exportBalesVCF}
          />
          <ExportCard
            title="Customers — Household Items"
            description="Customers categorised as Household Items buyers"
            icon={Contact}
            count={householdCustomers.length}
            isLoading={salesLoading}
            onCSV={exportHouseholdCSV}
            onVCF={exportHouseholdVCF}
          />
        </div>
      </section>

      {/* ── Import ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Import</h2>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <Contact className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p>Customer Contacts</p>
                <p className="text-sm font-normal text-[var(--muted-foreground)]">
                  Import from a .csv or .vcf (vCard) file
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-[var(--muted-foreground)]" />
              <p className="text-sm font-medium">Click to choose a file</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Supports <strong>.csv</strong> and <strong>.vcf</strong> formats
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.vcf,text/vcard,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            {/* CSV format hint */}
            <div className="rounded-lg bg-[var(--muted)] px-4 py-3 text-xs text-[var(--muted-foreground)] space-y-1">
              <p className="font-medium text-[var(--foreground)]">Expected CSV columns:</p>
              <p><code>Name, Phone, Address</code></p>
              <p className="mt-1">For VCF files, standard vCard 2.1 / 3.0 format is accepted (exported from phone contacts apps).</p>
            </div>

            {/* Import result */}
            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.success} contacts parsed successfully
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      {importResult.errors.length} issue{importResult.errors.length > 1 ? "s" : ""} found
                    </div>
                    {importResult.errors.slice(0, 5).map((err, i) => (
                      <p key={i} className="text-xs text-amber-700 dark:text-amber-400 pl-6">{err}</p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-amber-600 pl-6">…and {importResult.errors.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
