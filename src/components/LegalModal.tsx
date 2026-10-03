import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type LegalDoc = "terms" | "privacy" | "about";

const DOCS: Record<LegalDoc, { title: string; body: string[] }> = {
  about: {
    title: "About Valuation Management System (VMS)",
    body: [
      "VMS is Nepal’s premier digital valuation toolkit engineered specifically for registered engineers, land valuators, and real estate professionals. Designed to bridge regional land metrics and GIS spatial intelligence, VMS delivers precision land arithmetic across Terai (Bigha-Kattha-Dhur-Kanwa) and Hilly (Ropani-Aana-Paisa-Dam) systems, automated government rate indexing, and verified field mapping.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "1. Acceptance: By accessing VMS, users agree to adhere to these terms.",
      "2. Role Restrictions: Guest users receive read-only and calculation capabilities. Nepal Engineering Council (NEC) and Diploma Engineers Association Nepal (DEAN) credentials are reviewed under the same administrator-led verification standard. Submission alone does not grant verified valuator access.",
      "3. Data Integrity: Creators are responsible for the accuracy of their market entries. Active records, including property locations and rates, are visible to all signed-in users. Non-admin government rate contributions require approval before publication.",
      "4. Moderation and Deletion: Creators can edit and soft-delete their records. Soft-deleted entries are removed from the Records and Map views but retained in an administrator-only Recycle Bin until restored or permanently deleted by an administrator. Reported records may be reviewed and moderated.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "1. Information Collection: We collect account details, NEC or DEAN registration or membership numbers and passout year for equal, administrator-reviewed professional verification, and user-submitted property coordinates. Professional numbers are available only to their owner and administrators, not in the public creator directory.",
      "2. Location Services: Live GPS coordinates are accessed strictly during active map interaction for pinpoint location targeting and pin creation.",
      "3. Record Visibility: Active valuation records, creator names and verification flags, rates, and saved property coordinates are visible to signed-in users. Pending government rate contributions are not shown in the published library while administrators review them.",
      "4. Retention and Deletion: Soft-deleted records leave the Records and Map views immediately but remain in an administrator-only Recycle Bin for restoration or permanent deletion. Administrators can view audit activity associated with record and rate changes.",
      "5. Data Protection: Professional verification numbers remain private to their owner and administrators. Uploaded government documents are stored with access controls. We do not sell user data to third parties.",
    ],
  },
};

export function LegalModal({
  doc,
  onOpenChange,
}: {
  doc: LegalDoc | null;
  onOpenChange: (open: boolean) => void;
}) {
  const content = doc ? DOCS[doc] : null;
  return (
    <Dialog open={Boolean(doc)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-left text-lg font-bold">
            {content?.title}
          </DialogTitle>
          <DialogDescription className="sr-only">VMS legal information</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          {content?.body.map((p) => <p key={p}>{p}</p>)}
        </div>
        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          VMS v1.2.0 (Build 2026.08) • Package: com.vmsnepal.app
        </p>
      </DialogContent>
    </Dialog>
  );
}
