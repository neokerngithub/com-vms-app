import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "admin" | "valuator" | "guest";

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  nec_number: string | null;
  is_verified: boolean;
  role: AdminRole;
}

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_users"],
    enabled,
    queryFn: async (): Promise<AdminUser[]> => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, nec_number, is_verified")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const admins = new Set(
        (roles ?? [])
          .filter((r: { role: string }) => r.role === "admin")
          .map((r: { user_id: string }) => r.user_id),
      );
      return (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        nec_number: p.nec_number ?? null,
        is_verified: Boolean(p.is_verified),
        role: admins.has(p.id) ? "admin" : p.is_verified ? "valuator" : "guest",
      }));
    },
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_verified,
      nec_number,
      role,
    }: {
      id: string;
      is_verified?: boolean;
      nec_number?: string | null;
      role?: AdminRole;
    }) => {
      const patch: Record<string, unknown> = {};
      if (nec_number !== undefined) patch['nec_number'] = nec_number;
      if (is_verified !== undefined) patch['is_verified'] = is_verified;
      if (role !== undefined) patch['is_verified'] = role !== "guest";

      if (Object.keys(patch).length) {
        const { error } = await supabase
          .from("profiles")
          .update(patch as never)
          .eq("id", id);
        if (error) throw error;
      }

      if (role !== undefined) {
        if (role === "admin") {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: id, role: "admin" } as never);
          if (error && !/duplicate/i.test(error.message)) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .delete()
            .eq("user_id", id)
            .eq("role", "admin");
          if (error) throw error;
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] }),
  });
}
