import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useReportRecord } from "@/hooks/useRecords";

const MIN = 10;

export function ReportDialog({
  recordId,
  open,
  onOpenChange,
}: {
  recordId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const report = useReportRecord();
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= MIN;

  const close = (o: boolean) => {
    if (!o) setReason("");
    onOpenChange(o);
  };

  const submit = async () => {
    if (!valid || !user || !recordId) return;
    try {
      await report.mutateAsync({ recordId, reason: reason.trim(), userId: user.id });
      toast.success("Report submitted. Thank you.");
      close(false);
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("duplicate")
          ? "You already reported this record."
          : "Could not submit the report.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-3xl border-border bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left text-lg font-bold">Report this record</DialogTitle>
          <DialogDescription className="text-left text-sm text-muted-foreground">
            Describe what is inaccurate. A description is required before submitting.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="e.g. The market rate is far above the actual transacted rate in this ward."
          className="w-full rounded-2xl border border-border bg-surface-2 p-4 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
        />
        <p className="text-xs text-muted-foreground">
          {reason.trim().length}/{MIN} characters minimum
        </p>
        <button
          onClick={submit}
          disabled={!valid || report.isPending}
          className="tap gradient-brand w-full rounded-2xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          {report.isPending ? "Submitting…" : "Submit Report"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
