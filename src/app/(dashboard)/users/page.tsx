"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  useUsers,
  useInviteUser,
  useUpdateUserRole,
  useDeleteUser,
} from "@/lib/hooks/use-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, ShieldAlert, Trash2, UserPlus, X } from "lucide-react";
import { SELECT_CLASS } from "@/lib/format";
import type { UserRole } from "@/lib/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  sales_rep: "Sales Rep",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300",
  sales_rep: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
  viewer: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
};

export default function UsersPage() {
  const { isAdmin, isLoading: authLoading, user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const inviteUser = useInviteUser();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");

  // Per-row inline role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>("viewer");

  // Per-row delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (authLoading) return <Skeleton className="h-96" />;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Only admins can manage users.
        </p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteUser.mutate(
      { email: inviteEmail, role: inviteRole, full_name: inviteFullName },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${inviteEmail}`);
          setInviteOpen(false);
          setInviteEmail("");
          setInviteFullName("");
          setInviteRole("viewer");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const handleRoleEdit = (userId: string, currentRole: UserRole) => {
    setEditingRoleId(userId);
    setPendingRole(currentRole);
  };

  const handleRoleSave = (userId: string) => {
    updateRole.mutate(
      { userId, role: pendingRole },
      {
        onSuccess: () => { toast.success("Role updated."); setEditingRoleId(null); },
        onError: (err) => { toast.error(err.message); setEditingRoleId(null); },
      }
    );
  };

  const handleDelete = (userId: string) => {
    deleteUser.mutate(userId, {
      onSuccess: () => { toast.success("User removed."); setConfirmDeleteId(null); },
      onError: (err) => { toast.error(err.message); setConfirmDeleteId(null); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Invite team members and manage their access roles
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge className={ROLE_COLORS.admin}>Admin</Badge>
          <span className="text-[var(--muted-foreground)]">Full access including Audit Logs &amp; Users</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ROLE_COLORS.sales_rep}>Sales Rep</Badge>
          <span className="text-[var(--muted-foreground)]">Can input Sales, Inventory, Expenses, Products</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ROLE_COLORS.viewer}>Viewer</Badge>
          <span className="text-[var(--muted-foreground)]">Read-only access to all tabs</span>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-[var(--muted-foreground)]">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  (users ?? []).map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || "—"}
                          {isSelf && (
                            <span className="ml-2 text-xs text-[var(--muted-foreground)]">(you)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          {editingRoleId === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={pendingRole}
                                onChange={(e) => setPendingRole(e.target.value as UserRole)}
                                className={`h-8 w-32 text-sm ${SELECT_CLASS}`}
                                autoFocus
                              >
                                <option value="admin">Admin</option>
                                <option value="sales_rep">Sales Rep</option>
                                <option value="viewer">Viewer</option>
                              </select>
                              <button
                                onClick={() => handleRoleSave(u.id)}
                                disabled={updateRole.isPending}
                                className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 transition-colors"
                                title="Save"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingRoleId(null)}
                                className="p-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-500 transition-colors"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => !isSelf && handleRoleEdit(u.id, u.role as UserRole)}
                              title={isSelf ? "You cannot change your own role" : "Click to change role"}
                              className={`${isSelf ? "cursor-default" : "hover:opacity-80 cursor-pointer"}`}
                            >
                              <Badge className={ROLE_COLORS[u.role as UserRole] ?? ""}>
                                {ROLE_LABELS[u.role as UserRole] ?? u.role}
                              </Badge>
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-[var(--muted-foreground)]">
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {!isSelf && (
                            confirmDeleteId === u.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  disabled={deleteUser.isPending}
                                  className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 transition-colors"
                                  title="Confirm remove"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="p-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-500 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(u.id)}
                                className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--muted-foreground)] hover:text-red-600 transition-colors"
                                title="Remove user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite a Team Member
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name (optional)</Label>
              <Input
                placeholder="e.g. John Doe"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. john@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className={`w-full ${SELECT_CLASS}`}
              >
                <option value="viewer">Viewer — read-only access</option>
                <option value="sales_rep">Sales Rep — can input data</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              The user will receive an email invitation to set their own password and join the app.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteUser.isPending || !inviteEmail}>
                {inviteUser.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
