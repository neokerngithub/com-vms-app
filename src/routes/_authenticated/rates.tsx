import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileText, Link2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
const DocViewerModal = lazy(() =>
  import("@/components/DocViewerModal").then((m) => ({ default: m.DocViewerModal })),
);
import { toast } from "sonner";
import { useAddGovRate, useDeleteGovRate, useGovRates, useUpdateGovRate } from "@/hooks/useRecords";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_FISCAL_YEAR, FISCAL_YEARS } from "@/lib/vms";

const RATES_BUCKET = "rates";
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
  const [year, setYear] = useState<string>(DEFAULT_FISCAL_YEAR);
  const [office, setOffice] = useState("All");
  const [adding, setAdding] = useState(false);
  const [fy, setFy] = useState<string>(DEFAULT_FISCAL_YEAR);

  const [officeName, setOfficeName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [mode, setMode] = useState<"pdf" | "link">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addRate = useAddGovRate();
  const updateRate = useUpdateGovRate();
  const deleteRate = useDeleteGovRate();
  const { isAdmin } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);
  const [editFy, setEditFy] = useState<string>(DEFAULT_FISCAL_YEAR);
  const [editOffice, setEditOffice] = useState("");
  const [viewing, setViewing] = useState<{ url: string; title: string } | null>(null);

  const openDoc = async (r: { pdf_url: string; district_office: string; fiscal_year: string }) => {
    const title = `${r.district_office} · FY ${r.fiscal_year}`;
    try {
      if (/^https?:\/\//i.test(r.pdf_url)) {
        setViewing({ url: r.pdf_url, title });
        return;
      }
      const { data: signed, error } = await supabase.storage
        .from(RATES_BUCKET)
        .createSignedUrl(r.pdf_url, 60 * 60);
      if (error) throw error;
      setViewing({ url: signed.signedUrl, title });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the document");
    }
  };

  const resetForm = () => {
    setAdding(false);
    setOfficeName("");
    setPdfUrl("");
    setFile(null);
    setMode("pdf");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let location = pdfUrl.trim();

      if (mode === "pdf") {
        if (!file) throw new Error("Choose a PDF file to upload.");
        setUploading(true);
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) throw new Error("You must be signed in to upload.");
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from(RATES_BUCKET)
          .upload(path, file, { contentType: file.type || "application/pdf" });
        if (upErr) throw upErr;
        location = path;
      } else if (!location) {
        throw new Error("Enter a document link.");
      }

      await addRate.mutateAsync({
        fiscal_year: fy.trim(),
        district_office: officeName.trim(),
        pdf_url: location,
      });
      toast.success("Publication added to the library.");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add publication");
    } finally {
      setUploading(false);
    }
  };

  const years = useMemo(() => ["All", ...FISCAL_YEARS], []);

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
              <select
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                required
                className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
              >
                {FISCAL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
            <Field label="Document">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("pdf");
                    fileRef.current?.click();
                  }}
                  className={cn(
                    "tap flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold",
                    mode === "pdf"
                      ? "gradient-brand border-transparent text-primary-foreground"
                      : "border-border bg-surface-2 text-muted-foreground",
                  )}
                >
                  <Upload className="size-4" /> Add PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("link");
                    setFile(null);
                  }}
                  className={cn(
                    "tap flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold",
                    mode === "link"
                      ? "gradient-brand border-transparent text-primary-foreground"
                      : "border-border bg-surface-2 text-muted-foreground",
                  )}
                >
                  <Link2 className="size-4" /> Add Link
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {mode === "pdf" && file && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove file"
                    onClick={() => setFile(null)}
                    className="tap grid size-8 place-items-center rounded-lg text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
              {mode === "link" && (
                <input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  required
                  type="url"
                  maxLength={500}
                  placeholder="https://…/rates.pdf or Google Drive link"
                  className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
                />
              )}
            </Field>
            <button
              type="submit"
              disabled={addRate.isPending || uploading}
              className="tap gradient-brand w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {uploading ? "Uploading…" : addRate.isPending ? "Checking…" : "Add publication"}
            </button>
          </form>
        )}

        <Field label="Fiscal year">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y === "All" ? "All fiscal years" : y}
              </option>
            ))}
          </select>
        </Field>
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
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => openDoc(r)}
                  className="tap gradient-brand flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  <Eye className="size-4" />
                  View
                </button>
                {isAdmin && (
                  <>
                    <button
                      aria-label="Edit publication"
                      onClick={() => {
                        setEditing(r.id);
                        setEditFy(r.fiscal_year);
                        setEditOffice(r.district_office);
                      }}
                      className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      aria-label="Delete publication"
                      onClick={async () => {
                        if (!window.confirm("Delete this publication?")) return;
                        try {
                          await deleteRate.mutateAsync(r.id);
                          toast.success("Publication deleted.");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Could not delete",
                          );
                        }
                      }}
                      className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-destructive/40 bg-surface-2 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
              {isAdmin && editing === r.id && (
                <div className="col-span-3 space-y-2">
                  <select
                    value={editFy}
                    onChange={(e) => setEditFy(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
                  >
                    {FISCAL_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <input
                    value={editOffice}
                    onChange={(e) => setEditOffice(e.target.value)}
                    maxLength={120}
                    className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="tap rounded-xl border border-border bg-surface-2 py-3 text-xs font-bold text-muted-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateRate.mutateAsync({
                            id: r.id,
                            fiscal_year: editFy.trim(),
                            district_office: editOffice.trim(),
                          });
                          toast.success("Publication updated.");
                          setEditing(null);
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Could not update",
                          );
                        }
                      }}
                      className="tap gradient-brand rounded-xl py-3 text-xs font-bold text-primary-foreground"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {viewing && (
        <Suspense fallback={null}>
          <DocViewerModal
            url={viewing.url}
            title={viewing.title}
            onOpenChange={(o) => !o && setViewing(null)}
          />
        </Suspense>
      )}
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
