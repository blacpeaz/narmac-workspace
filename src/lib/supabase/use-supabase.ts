"use client";

import { useMemo } from "react";
import { createClient } from "./client";

/** Singleton-per-render supabase client hook — avoids calling createClient() in every hook. */
export function useSupabase() {
  return useMemo(() => createClient(), []);
}
