import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecordCard } from "@/components/RecordCard";
import { RecordDetailSheet } from "@/components/RecordDetailSheet";
import { RecordForm } from "@/components/RecordForm";
import { ReportDialog } from "@/components/ReportDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRecords, type RecordWithCreator } from "@/hooks/useRecords";
import { cn } from "@/lib/utils";

const SORTS = ["Newest", "Oldest", "Highest Rs", "Lowest Rs"] as const;
type Sort = (typeof SORTS)[number];

const SCOPES = ["Total Records", "My Records"] as const;
type Scope = (typeof SCOPES)[number];

export const Route = createFileRoute("/_authenticated/records")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { record?: string | undefined } => ({
    record: typeof search['record'] === "string" ? (search['record'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Universal Records — VMS" },
      {
        name: "description",
        content: "Search and filter every shared land market valuation record.",
      },
      { property: "og:title", content: "Universal Records — VMS" },
      { property: "og:description", content: "Shared land market valuation records." },
    ],
  }),
  component: RecordsPage,
});

function RecordsPage() {
  const { data = [], isLoading } = useRecords();
  const { user, canPublish } = useAuth();
  const { record: focusId } = Route.useSearch();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("Newest");
  const [scope, setScope] = useState<Scope>("Total Records");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecordWithCreator | null>(null);
  const [detail, setDetail] = useState<RecordWithCreator | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const navigate = useNavigate();

  const list = useMemo(() => {
    if (focusId) return data.filter((r) => r.id === focusId);
    const scoped =
      scope === "My Records" ? data.filter((r) => r.created_by === user?.id) : data;
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? scoped.filter((r) =>
          [r.location_in_cadastral_map, r.district, r.remarks, r.creator_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle)),
        )
      : scoped;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "Oldest":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "Highest Rs":
          return b.market_rate - a.market_rate;
        case "Lowest Rs":
          return a.market_rate - b.market_rate;
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    });
    return sorted;
  }, [data, q, sort, scope, user?.id, focusId]);

  const guestBlocked = scope === "My Records" && !user;

  return (
    <AppShell
      title="Records"
      {...(canPublish
        ? {
            onAdd: () => {
              setEditing(null);
              setFormOpen(true);
            },
          }
        : {})}
    >
      {focusId && (
        <button
          onClick={() => navigate({ to: "/records", search: {} })}
          className="tap mb-3 flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-bold text-muted-foreground"
        >
          Showing one record from the map
          <span className="gradient-text">Show all</span>
        </button>
      )}

      <div className="mb-3 flex rounded-2xl border border-border bg-surface p-1">
        {SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            aria-pressed={scope === s}
            className={cn(
              "tap flex-1 rounded-xl px-3 py-2.5 text-xs font-bold",
              scope === s
                ? "gradient-brand text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search location, address, ward..."
          maxLength={120}
          className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
        />
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "tap shrink-0 rounded-full border px-4 py-2 text-xs font-bold",
              sort === s
                ? "gradient-brand border-transparent text-primary-foreground"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs font-semibold text-muted-foreground">
        Secure Data Governance — Creator-managed edits with admin moderation
      </p>

      <div className="mt-3 space-y-3">
        {guestBlocked && (
          <div className="surface-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">Sign in to see your records</p>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="tap gradient-brand mt-4 rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Sign in
            </button>
          </div>
        )}
        {!guestBlocked && isLoading && (
          <p className="text-sm text-muted-foreground">Loading records…</p>
        )}
        {!guestBlocked && !isLoading && list.length === 0 && (
          <div className="surface-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No records yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap “Add Record” to log your first site visit.
            </p>
          </div>
        )}
        {!guestBlocked &&
          list.map((r) => (
            <RecordCard
              key={r.id}
              record={r}
              onOpen={setDetail}
              onReport={(rec) => setReportId(rec.id)}
              onEdit={(rec) => {
                setEditing(rec);
                setFormOpen(true);
              }}
              onLocate={() => navigate({ to: "/map" })}
            />
          ))}
      </div>

      <RecordDetailSheet
        record={detail}
        onOpenChange={(o) => !o && setDetail(null)}
        onEdit={(rec) => {
          setDetail(null);
          setEditing(rec);
          setFormOpen(true);
        }}
        onReport={(rec) => {
          setDetail(null);
          setReportId(rec.id);
        }}
        onLocate={() => {
          setDetail(null);
          navigate({ to: "/map" });
        }}
      />

      <ReportDialog
        recordId={reportId}
        open={Boolean(reportId)}
        onOpenChange={(o) => !o && setReportId(null)}
      />

      <RecordForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </AppShell>
  );
}
