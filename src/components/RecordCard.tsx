import { Flag, MapPin, Pencil, Trash2, ImageIcon, Navigation } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RecordWithCreator } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteRecord } from "@/hooks/useRecords";
import { formatNPR } from "@/lib/units";
import { usePhotoUrl } from "@/lib/photos";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function IconButton({
  label,
  onClick,
  children,
  tone = "default",
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`tap grid size-9 place-items-center rounded-xl border border-border bg-surface-2 ${
        tone === "danger" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function RecordCard({
  record,
  onEdit,
  onLocate,
  onOpen,
  onReport,
}: {
  record: RecordWithCreator;
  onEdit: (r: RecordWithCreator) => void;
  onLocate?: (r: RecordWithCreator) => void;
  onOpen?: (r: RecordWithCreator) => void;
  onReport?: (r: RecordWithCreator) => void;
}) {
  const { user, isAdmin } = useAuth();
  const photoUrl = usePhotoUrl(record.image_url);
  const isOwner = user?.id === record.created_by;
  const del = useDeleteRecord();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <article
      onClick={() => onOpen?.(record)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(record);
        }
      }}
      className="surface-card tap overflow-hidden p-4"
    >
      <div className="flex gap-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-2">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Site at ${record.location_in_cadastral_map}`}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground">
            {record.location_in_cadastral_map || "Untitled location"}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {record.district || "—"}
            {record.locality ? ` · ${record.locality}` : ""}
          </p>
          <p className="mt-2 text-lg font-extrabold">
            <span className="gradient-text">{formatNPR(record.market_rate)}</span>
            <span className="ml-1 text-xs font-semibold text-muted-foreground">
              / {record.unit}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {record.type_of_road && <Chip>{record.type_of_road}</Chip>}
        {record.road_width && <Chip>{record.road_width} wide</Chip>}
        {record.reports_count > 0 && (
          <Chip tone="danger">{record.reports_count} report(s)</Chip>
        )}
      </div>

      {record.remarks && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{record.remarks}</p>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-3">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          By <span className="font-semibold text-foreground">{record.creator_name}</span> ·{" "}
          {new Date(record.data_entry_date).toLocaleDateString()}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {onLocate && record.latitude != null && (
            <IconButton label="Show on map" onClick={() => onLocate(record)}>
              <Navigation className="size-4" />
            </IconButton>
          )}
          {isOwner ? (
            <IconButton label="Edit record" onClick={() => onEdit(record)}>
              <Pencil className="size-4" />
            </IconButton>
          ) : (
            <IconButton label="Report record" onClick={() => onReport?.(record)}>
              <Flag className="size-4" />
            </IconButton>
          )}
          {isAdmin && (
            <IconButton
              label="Delete record"
              tone="danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
            </IconButton>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-2xl border-border bg-popover">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the valuation record for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground"
              onClick={async () => {
                try {
                  await del.mutateAsync(record.id);
                  toast.success("Record deleted");
                } catch {
                  toast.error("Delete failed");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <span
      className={`rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold ${
        tone === "danger"
          ? "border-destructive/40 text-destructive"
          : "bg-surface-2 text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}
