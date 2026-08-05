import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecordCard } from "@/components/RecordCard";
import { RecordForm } from "@/components/RecordForm";
import { useRecords, type RecordWithCreator } from "@/hooks/useRecords";
import { cn } from "@/lib/utils";

const SORTS = ["Newest", "Oldest", "Highest Rs", "Lowest Rs"] as const;
type Sort = (typeof SORTS)[number];

export const Route = createFileRoute("/_authenticated/records")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { record?: string } => ({
    record: typeof search.record === "string" ? search.record : undefined,
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
  const { record: focusId } = Route.useSearch();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("Newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecordWithCreator | null>(null);
  const navigate = useNavigate();

  const list = useMemo(() => {
    if (focusId) return data.filter((r) => r.id === focusId);
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? data.filter((r) =>
          [r.location_in_cadastral_map, r.district, r.remarks, r.creator_name]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(needle)),
        )
      : data;
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
  }, [data, q, sort]);

  return (
    <AppShell
      title="Records"
      onAdd={() => {
        setEditing(null);
        setFormOpen(true);
      }}
    >
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

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading records…</p>}
        {!isLoading && list.length === 0 && (
          <div className="surface-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No records yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap “Add Record” to log your first site visit.
            </p>
          </div>
        )}
        {list.map((r) => (
          <RecordCard
            key={r.id}
            record={r}
            onEdit={(rec) => {
              setEditing(rec);
              setFormOpen(true);
            }}
            onLocate={() => navigate({ to: "/map" })}
          />
        ))}
      </div>

      <RecordForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </AppShell>
  );
}
