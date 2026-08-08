import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, Flag, ImageIcon, MapPin, Navigation, Pencil } from "lucide-react";
import { useState } from "react";
import type { RecordWithCreator } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { formatNPR } from "@/lib/units";
import { usePhotoUrl } from "@/lib/photos";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function RecordDetailSheet({
  record,
  onOpenChange,
  onEdit,
  onReport,
  onLocate,
}: {
  record: RecordWithCreator | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (r: RecordWithCreator) => void;
  onReport: (r: RecordWithCreator) => void;
  onLocate: (r: RecordWithCreator) => void;
}) {
  const { user } = useAuth();
  const [zoom, setZoom] = useState(false);
  const photoUrl = usePhotoUrl(record?.image_url ?? null);
  const isOwner = record ? user?.id === record.created_by : false;

  return (
    <>
      <Sheet open={Boolean(record)} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] overflow-y-auto rounded-t-3xl border-border bg-popover p-0"
        >
          {record && (
            <div className="safe-bottom mx-auto w-full max-w-3xl px-5 pb-8 pt-6">
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl font-extrabold text-foreground">
                  {record.location_in_cadastral_map || "Untitled location"}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" />
                  {record.district || "—"}
                  {record.locality ? ` · ${record.locality}` : ""}
                </SheetDescription>
              </SheetHeader>

              <button
                onClick={() => photoUrl && setZoom(true)}
                aria-label="Open property photo"
                className="tap mt-4 grid h-48 w-full place-items-center overflow-hidden rounded-2xl border border-border bg-surface-2"
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`Site at ${record.location_in_cadastral_map}`}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </button>

              <p className="mt-4 text-2xl font-extrabold">
                <span className="gradient-text">{formatNPR(record.market_rate)}</span>
                <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
                  / {record.unit}
                </span>
              </p>

              <div className="mt-4 divide-y divide-border border-y border-border">
                <Row label="Cadastral ward" value={record.location_in_cadastral_map || "—"} />
                <Row label="District" value={record.district || "—"} />
                <Row label="Locality" value={record.locality || "—"} />
                <Row label="Road type" value={record.type_of_road || "—"} />
                <Row label="Road width" value={record.road_width || "—"} />
                <Row label="Site visited by" value={record.site_visited_by || "—"} />
                <Row
                  label="Coordinates"
                  value={
                    record.latitude != null && record.longitude != null
                      ? `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}`
                      : "Not recorded"
                  }
                />
              </div>

              {record.remarks && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Remarks
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {record.remarks}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
                By <span className="font-bold text-foreground">{record.creator_name}</span>
                {record.creator_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                    <BadgeCheck className="size-3" /> NEC Verified
                  </span>
                )}
                · {new Date(record.data_entry_date).toLocaleDateString()}
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {record.latitude != null && (
                  <button
                    onClick={() => onLocate(record)}
                    className="tap flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 py-3.5 text-sm font-bold text-foreground"
                  >
                    <Navigation className="size-4" /> View on Map
                  </button>
                )}
                {isOwner ? (
                  <button
                    onClick={() => onEdit(record)}
                    className="tap gradient-brand flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground"
                  >
                    <Pencil className="size-4" /> Edit record
                  </button>
                ) : (
                  <button
                    onClick={() => onReport(record)}
                    className="tap flex items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-surface-2 py-3.5 text-sm font-bold text-destructive"
                  >
                    <Flag className="size-4" /> Report record
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Property photo</DialogTitle>
          {photoUrl && (
            <img
              src={photoUrl}
              alt={`Site at ${record?.location_in_cadastral_map ?? "property"}`}
              className="max-h-[80dvh] w-full rounded-2xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
