import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { useAddGovRate, useGovRates } from "@/hooks/useRecords";
import { FISCAL_YEARS } from "@/lib/vms";
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
  const [adding, setAdding] = useState(false);
  const [fy, setFy] = useState(FISCAL_YEARS[0] as string);
  const [officeName, setOfficeName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const addRate = useAddGovRate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRate.mutateAsync({
        fiscal_year: fy.trim(),
        district_office: officeName.trim(),
        pdf_url: pdfUrl.trim(),
      });
      toast.success("Publication added to the library.");
      setAdding(false);
      setOfficeName("");
      setPdfUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add publication");
    }
  };

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
    <AppShell title="Government Rates" back>
      <div className="space-y-4 pb-8">
        <button
          onClick={() => setAdding((v) => !v)}
          className="tap flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3.5 text-sm font-bold text-foreground"
        >
          {adding ? <X className="size-4" /> : <Plus className="size-4" />}
          {adding ? "Cancel" : "Contribute a publication"}
        </button>

        {adding && (
          <form onSubmit={submit} className="surface-card space-y-3 p-4">
            <Field label="Fiscal year">
              <input
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                required
                maxLength={16}
                placeholder="2082-83"
                className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </Field>
            <Field label="District / Office">
              <input
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                required
                maxLength={120}
                placeholder="Land Revenue Office, Morang"
                className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </Field>
            <Field label="PDF link">
              <input
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                required
                type="url"
                maxLength={500}
                placeholder="https://…/rates.pdf"
                className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </Field>
            <button
              type="submit"
              disabled={addRate.isPending}
              className="tap gradient-brand w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {addRate.isPending ? "Checking…" : "Add publication"}
            </button>
          </form>
        )}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
