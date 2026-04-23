"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/database";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSalesRep: boolean;
  isViewer: boolean;
  canEdit: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isSalesRep: false,
  isViewer: false,
  canEdit: false,
  isLoading: true,
  signOut: async () => {},
});

/** Fetches the user profile row from the `users` table for a given user ID.
 * Resolves to null after 8 seconds so a sleeping Supabase project never blocks the UI. */
async function fetchProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 8_000)
  );
  const query = supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()
    .then(({ data }) => (data as UserProfile | null));
  return Promise.race([query, timeout]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable client instance — created once on mount, never re-created on re-render.
  const [supabase] = useState<SupabaseClient>(() => createClient());

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
    // so a separate getUser() call is not needed and would race for the same
    // PKCE auth token lock, causing the "lock was stolen" error.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setProfile(currentUser ? await fetchProfile(supabase, currentUser.id) : null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === "admin",
        isSalesRep: profile?.role === "sales_rep",
        isViewer: profile?.role === "viewer",
        canEdit: profile?.role === "admin" || profile?.role === "sales_rep",
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
