import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREA_UNITS } from "@/lib/units";
import { LOCALITIES, ROAD_TYPES } from "@/lib/vms";
import { useAuth } from "@/hooks/useAuth";
import { useSaveRecord } from "@/hooks/useRecords";
import type { RecordWithCreator } from "@/hooks/useRecords";

const empty = {
  site_visited_by: "",
  location_in_cadastral_map: "",
  district: "",
  latitude: "",
  longitude: "",
  market_rate: "",
  unit: "Dhur",
  road_width: "",
  type_of_road: "Pitched road",
  locality: "Residential",
  remarks: "",
  image_url: "",
};

export function RecordForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: RecordWithCreator | null;
}) {
  const { user, profile } = useAuth();
  const save = useSaveRecord();
  const [form, setForm] = useState({ ...empty });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        site_visited_by: editing.site_visited_by ?? "",
        location_in_cadastral_map: editing.location_in_cadastral_map ?? "",
        district: editing.district ?? "",
        latitude: editing.latitude?.toString() ?? "",
        longitude: editing.longitude?.toString() ?? "",
        market_rate: editing.market_rate?.toString() ?? "",
        unit: editing.unit ?? "Dhur",
        road_width: editing.road_width ?? "",
        type_of_road: editing.type_of_road ?? "Pitched road",
        locality: editing.locality ?? "Residential",
        remarks: editing.remarks ?? "",
        image_url: editing.image_url ?? "",
      });
    } else {
      setForm({ ...empty, site_visited_by: profile?.full_name ?? "" });
    }
  }, [open, editing, profile]);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.location_in_cadastral_map.trim() || !form.district.trim()) {
      toast.error("Location and district are required.");
      return;
    }
    try {
      await save.mutateAsync({
        ...(editing ? { id: editing.id } : { created_by: user.id }),
        site_visited_by: form.site_visited_by.trim().slice(0, 120),
        location_in_cadastral_map: form.location_in_cadastral_map.trim().slice(0, 200),
        district: form.district.trim().slice(0, 100),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        market_rate: Number(form.market_rate) || 0,
        unit: form.unit,
        road_width: form.road_width.trim().slice(0, 60) || null,
        type_of_road: form.type_of_road,
        locality: form.locality,
        remarks: form.remarks.trim().slice(0, 1000) || null,
        image_url: form.image_url.trim().slice(0, 500) || null,
      } as never);
      toast.success(editing ? "Record updated" : "Record added");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the record");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        toast.success("Coordinates captured");
      },
      () => toast.error("Could not read your location"),
    );
  };

  const field = "h-12 rounded-xl border-border bg-surface-2 text-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editing ? "Edit record" : "Add record"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Site visited by</Label>
            <Input
              className={field}
              value={form.site_visited_by}
              onChange={(e) => set("site_visited_by", e.target.value)}
              placeholder="Valuer name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Location in cadastral map</Label>
            <Input
              className={field}
              value={form.location_in_cadastral_map}
              onChange={(e) => set("location_in_cadastral_map", e.target.value)}
              placeholder="Ward 5, Tinpaini"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">District</Label>
              <Input
                className={field}
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                placeholder="Morang"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Road width</Label>
              <Input
                className={field}
                value={form.road_width}
                onChange={(e) => set("road_width", e.target.value)}
                placeholder="20 ft"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Market rate (Rs.)</Label>
              <Input
                className={field}
                inputMode="decimal"
                value={form.market_rate}
                onChange={(e) => set("market_rate", e.target.value)}
                placeholder="250000"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Unit</Label>
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger className={field}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {AREA_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Type of road</Label>
              <Select value={form.type_of_road} onValueChange={(v) => set("type_of_road", v)}>
                <SelectTrigger className={field}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {ROAD_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Locality</Label>
              <Select value={form.locality} onValueChange={(v) => set("locality", v)}>
                <SelectTrigger className={field}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  {LOCALITIES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Latitude</Label>
              <Input
                className={field}
                inputMode="decimal"
                value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                placeholder="26.448557"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Longitude</Label>
              <Input
                className={field}
                inputMode="decimal"
                value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                placeholder="87.282560"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="tap w-full rounded-xl border border-border bg-surface-2 py-3 text-sm font-semibold text-foreground"
          >
            Use my current location
          </button>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Photo URL (optional)</Label>
            <Input
              className={field}
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Remarks</Label>
            <Textarea
              className="min-h-24 rounded-xl border-border bg-surface-2"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              maxLength={1000}
              placeholder="Notes about access, shape, frontage…"
            />
          </div>

          <button
            type="submit"
            disabled={save.isPending}
            className="tap gradient-brand w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add record"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
