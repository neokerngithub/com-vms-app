import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GovRate, VmsRecord } from "@/lib/vms";

export interface RecordWithCreator extends VmsRecord {
  creator_name: string;
  creator_verified: boolean;
}

export function useRecords() {
  return useQuery({
    queryKey: ["records"],
    queryFn: async (): Promise<RecordWithCreator[]> => {
      const { data, error } = await supabase
        .from("records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as VmsRecord[];
      const ids = [...new Set(rows.map((r) => r.created_by))];
      const names = new Map<string, string>();
      const verified = new Map<string, boolean>();
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, is_verified")
          .in("id", ids);
        (profiles ?? []).forEach(
          (p: { id: string; full_name: string | null; is_verified: boolean | null }) => {
            names.set(p.id, p.full_name ?? "Unknown");
            verified.set(p.id, Boolean(p.is_verified));
          },
        );
      }
      return rows.map((r) => ({
        ...r,
        creator_name: names.get(r.created_by) ?? "Unknown",
        creator_verified: verified.get(r.created_by) ?? false,
      }));
    },
  });
}

export function useSaveRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<VmsRecord> & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase
          .from("records")
          .update(rest as never)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("records").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}

export function useReportRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recordId,
      reason,
      userId,
    }: {
      recordId: string;
      reason: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("record_reports")
        .insert({ record_id: recordId, reason, reported_by: userId } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["records"] }),
  });
}

export function useGovRates() {
  return useQuery({
    queryKey: ["government_rates"],
    queryFn: async (): Promise<GovRate[]> => {
      const { data, error } = await supabase
        .from("government_rates")
        .select("*")
        .order("fiscal_year", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as GovRate[];
    },
  });
}

export function useAddGovRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      fiscal_year: string;
      district_office: string;
      pdf_url: string;
    }) => {
      const { data: existing, error: checkError } = await supabase
        .from("government_rates")
        .select("id")
        .eq("fiscal_year", payload.fiscal_year)
        .eq("district_office", payload.district_office)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) {
        throw new Error(
          `Government rate for ${payload.district_office} in Fiscal Year ${payload.fiscal_year} already exists.`,
        );
      }
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in to add a publication.");
      const { error } = await supabase
        .from("government_rates")
        .insert({ ...payload, created_by: userId } as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["government_rates"] }),
  });
}

export function useUpdateGovRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      fiscal_year?: string;
      district_office?: string;
      pdf_url?: string;
    }) => {
      const { error } = await supabase
        .from("government_rates")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["government_rates"] }),
  });
}

export function useDeleteGovRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("government_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["government_rates"] }),
  });
}
