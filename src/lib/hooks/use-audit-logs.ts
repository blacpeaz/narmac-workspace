"use client";

import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/lib/supabase/use-supabase";
import type { AuditLog } from "@/lib/types/database";

interface AuditLogFilters {
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["audit-logs", filters],
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
        query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AuditLog[];
    },
  });
}
