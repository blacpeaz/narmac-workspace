"use client";

import { useState } from "react";
import { useExpenses, useCreateExpense } from "@/lib/hooks/use-expenses";
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
import { Receipt, Plus, Tags, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
} from "@/lib/hooks/use-expense-categories";

export default function ExpensesPage() {
  const { user, isAdmin } = useAuth();

  const { data: expenseCategories } = useExpenseCategories();
  const createExpenseCategory = useCreateExpenseCategory();
  const deleteExpenseCategory = useDeleteExpenseCategory();

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filters = {
    ...(dateFrom && { from: `${dateFrom}T00:00:00` }),
    ...(dateTo && { to: `${dateTo}T23:59:59` }),
    ...(categoryFilter && { category: categoryFilter }),
  };

  const { data: expenses, isLoading } = useExpenses(
    Object.keys(filters).length > 0 ? filters : undefined
  );
  const createExpense = useCreateExpense();

  // Form state
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createExpense.mutateAsync({
        category,
        amount: Number(amount),
        description: description || undefined,
        created_by: user.id,
      });

      toast.success("Expense recorded successfully");
      setCategory("");
      setAmount("");
      setDescription("");
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record expense";
      toast.error(message);
    }
  };

  const handleAddExpenseCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createExpenseCategory.mutateAsync(newCategoryName.trim());
      setCategory(cat.name);
      setNewCategoryName("");
      setShowNewCategory(false);
      toast.success(`Category "${cat.name}" created`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      toast.error(message);
    }
  };

  const handleDeleteExpenseCategory = (id: string, name: string) => {
    deleteExpenseCategory.mutate(id, {
      onSuccess: () => toast.success(`Category "${name}" deleted`),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Record and track business expenses
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Expense
          </Button>
        )}
      </div>

      {/* Expense form */}
      {showForm && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5" />
              Record an Expense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      onClick={handleAddExpenseCategory}
                      disabled={createExpenseCategory.isPending || !newCategoryName.trim()}
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
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                      required
                    >
                      <option value="">Select category</option>
                      {(expenseCategories ?? []).map((c) => (
                        <option key={c.id} value={c.name}>
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
                <Label>Amount</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What was the expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExpense.isPending || !amount}>
                  {createExpense.isPending ? "Recording..." : "Record Expense"}
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
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-40 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="">All categories</option>
            {(expenseCategories ?? []).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {(dateFrom || dateTo || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setCategoryFilter("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Manage Expense Categories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="w-4 h-4" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(expenseCategories ?? []).map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                {c.name}
                <button
                  onClick={() => handleDeleteExpenseCategory(c.id, c.name)}
                  className="ml-1 hover:text-red-600 transition-colors"
                  title={`Delete ${c.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(!expenseCategories || expenseCategories.length === 0) && (
              <p className="text-sm text-[var(--muted-foreground)]">
                No categories yet. Create one when recording an expense.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !expenses?.length ? (
            <div className="p-12 text-center text-[var(--muted-foreground)]">
              No expenses recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">
                      {format(new Date(expense.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted-foreground)] max-w-xs truncate">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted-foreground)]">
                      {(expense.user as unknown as { full_name: string })?.full_name ?? "—"}
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
