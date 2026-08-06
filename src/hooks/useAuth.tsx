import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  const loadProfile = async (id: string) => {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, is_verified")
      .eq("id", id)
      .maybeSingle();
    return (p as Profile) ?? null;
  };

  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const [p, { data: roles }] = await Promise.all([
        loadProfile(userId),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!active) return;
      setProfile(p);
      setIsAdmin(Boolean(roles?.some((r: { role: string }) => r.role === "admin")));
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    setProfile(await loadProfile(userId));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin,
        loading,
        signOut,
        refreshProfile,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
