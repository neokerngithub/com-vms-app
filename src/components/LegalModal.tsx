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
      "2. Role Restrictions: Guest users receive read-only and calculation capabilities. Verified Valuator status requires valid Nepal Engineering Council (NEC) registration verified by system administrators.",
      "3. Data Integrity: Valuators are sole authors of their published market entries and are responsible for data precision. System administrators reserve the right to moderate or delete fraudulent submissions.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "1. Information Collection: We collect account registration details, NEC numbers for verification, and user-submitted property coordinates.",
      "2. Location Services: Live GPS coordinates are accessed strictly during active map interaction for pinpoint location targeting and pin creation.",
      "3. Data Protection: Personal credentials and uploaded government documents are stored securely with encrypted database access controls. We do not sell user data to third parties.",
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
