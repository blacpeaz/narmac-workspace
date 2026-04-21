"use client";

import { useState } from "react";
import { createClient } from "./client";

/**
 * Returns a stable Supabase browser client that is created only once per
 * component lifecycle (not re-created on every render).
 * Using useState instead of useMemo guarantees a truly stable reference
 * because useState initializers only run on mount.
 */
export function useSupabase() {
  const [supabase] = useState(() => createClient());
  return supabase;
}
