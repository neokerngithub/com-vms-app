import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGovRates } from "@/hooks/useRecords";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rates")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Government Rates Library — VMS" },
      {
        name: "description",
        content:
          "Official government land rate publications by fiscal year and district land revenue office.",
      },
      { property: "og:title", content: "Government Rates Library — VMS" },
      {
        property: "og:description",
        content: "Government land rate PDFs by fiscal year and district office.",
      },
    ],
  }),
  component: RatesPage,
});

function RatesPage() {
  const { data = [], isLoading } = useGovRates();
  const [year, setYear] = useState("All");
  const [office, setOffice] = useState("All");

  const years = useMemo(
    () => ["All", ...new Set(data.map((r) => r.fiscal_year))],
    [data],
  );
  const offices = useMemo(
    () => ["All", ...new Set(data.map((r) => r.district_office))],
    [data],
  );

  const list = data.filter(
    (r) =>
      (year === "All" || r.fiscal_year === year) &&
      (office === "All" || r.district_office === office),
  );

  return (
    <AppShell title="Government Rates" showTabs={false}>
      <div className="space-y-4 pb-8">
        <Pills label="Fiscal year" options={years} value={year} onChange={setYear} />
        <Pills label="District / Office" options={offices} value={office} onChange={setOffice} />

        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && list.length === 0 && (
            <div className="surface-card p-8 text-center text-sm text-muted-foreground">
              No publications match these filters.
            </div>
          )}
          {list.map((r) => (
            <div
              key={r.id}
              className="surface-card tap grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4"
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {r.district_office}
                </p>
                <p className="text-xs text-muted-foreground">FY {r.fiscal_year}</p>
              </div>
              <a
                href={r.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap gradient-brand flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary-foreground"
              >
                <Download className="size-4" />
                PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Pills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "tap shrink-0 rounded-full border px-4 py-2 text-xs font-bold",
              value === o
                ? "gradient-brand border-transparent text-primary-foreground"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
