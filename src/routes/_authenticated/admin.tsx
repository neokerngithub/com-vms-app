import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RecordCard } from "@/components/RecordCard";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Management Console — VMS" },
      {
        name: "description",
        content: "Moderate reported valuation records and approve NEC valuators.",
      },
      { property: "og:title", content: "Admin Management Console — VMS" },
      { property: "og:description", content: "Moderation tools for VMS administrators." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const { data = [] } = useRecords();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/map", replace: true });
  }, [loading, isAdmin, navigate]);

  const reported = data.filter((r) => r.reports_count > 0);

  return (
    <AppShell title="Admin Console" back>
      <div className="surface-card mb-4 flex items-center gap-3 p-4">
        <ShieldCheck className="size-5 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Reported records awaiting moderation
        </p>
      </div>
      {reported.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No reported records right now.
        </p>
      ) : (
        <div className="space-y-3">
          {reported.map((r) => (
            <RecordCard key={r.id} record={r} onEdit={() => {}} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
