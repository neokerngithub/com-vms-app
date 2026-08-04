import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GovRate, VmsRecord } from "@/lib/vms";

export interface RecordWithCreator extends VmsRecord {
  creator_name: string;
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
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        (profiles ?? []).forEach((p: { id: string; full_name: string | null }) =>
          names.set(p.id, p.full_name ?? "Unknown"),
        );
      }
      return rows.map((r) => ({ ...r, creator_name: names.get(r.created_by) ?? "Unknown" }));
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
