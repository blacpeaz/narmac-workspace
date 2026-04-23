"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import type { AuditLog } from "@/lib/types/database";

// Audit logs don't need to be ultra-fresh; 30 seconds is sufficient.
const STALE_TIME = 30_000;

interface AuditLogFilters {
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Fetches audit log entries with optional filters for module, action, and date range.
 * Results are capped at 200 rows (newest first) to avoid large payloads.
 */
export function useAuditLogs(filters?: AuditLogFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["audit-logs", filters],
    staleTime: STALE_TIME,
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*, user:users(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.module) {
        query = query.eq("module", filters.module);
      }
      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        // Include the full final day by appending end-of-day time.
        query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

/** Deletes a single audit log entry by ID. */
export function useDeleteAuditLog() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("audit_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}

/** Deletes all audit log entries (admin wipe). */
export function useClearAuditLogs() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("audit_logs")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // matches all rows
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
}
