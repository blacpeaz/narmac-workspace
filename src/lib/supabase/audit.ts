import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditAction } from "@/lib/types/database";

interface AuditEntry {
  userId: string | undefined;
  action: AuditAction;
  module: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Inserts an audit log row. Throws if the insert fails. */
export async function logAudit(supabase: SupabaseClient, entry: AuditEntry) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: entry.userId,
    action: entry.action,
    module: entry.module,
    record_id: entry.recordId,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
  });
  if (error) throw error;
}

/**
 * Retrieves the currently authenticated user's ID.
 * Centralises `auth.getUser()` so mutations don't each call it directly.
 */
export async function getCurrentUserId(
  supabase: SupabaseClient
): Promise<string | undefined> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}
