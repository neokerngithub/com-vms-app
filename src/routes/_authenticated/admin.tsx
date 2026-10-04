import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, ChevronDown, FileText, History, ShieldCheck, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { RecordCard } from "@/components/RecordCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useAuditLogs,
  useDeleteGovRate,
  useGovRates,
  usePurgeRecord,
  useRecords,
  useRecycleBin,
  useRestoreRecord,
  useUpdateGovRate,
} from "@/hooks/useRecords";
import {
  useAdminUsers,
  useUpdateAdminUser,
  type AdminRole,
  type AdminUser,
} from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Management Console — VMS" },
      {
        name: "description",
        content: "Moderate reported valuation records and approve NEC / DEAN valuators.",
      },
      { property: "og:title", content: "Admin Management Console — VMS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "Moderation tools for VMS administrators." },
    ],
  }),
  component: AdminPage,
});

function Accordion({
  open,
  onToggle,
  icon,
  label,
  count,
  children,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  label: string;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="tap flex w-full items-center gap-3 p-4 text-left"
      >
        {icon}
        <p className="flex-1 text-sm font-semibold text-foreground">{label}</p>
        {count !== undefined && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {count}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="border-t border-border p-3">{children}</div>}
    </div>
  );
}

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const { data = [] } = useRecords();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers(isAdmin);
  const updateUser = useUpdateAdminUser();
  const navigate = useNavigate();
  const [necDraft, setNecDraft] = useState<Record<string, string>>({});
  const [openReported, setOpenReported] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [openCategory, setOpenCategory] = useState<AdminRole | null>(null);
  const [valuatorFilter, setValuatorFilter] = useState<"all" | "NEC" | "DEAN">("all");
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [deanDraft, setDeanDraft] = useState<Record<string, string>>({});
  const [openPending, setOpenPending] = useState(false);
  const [openRates, setOpenRates] = useState(false);
  const [openPublishedRates, setOpenPublishedRates] = useState(false);
  const [openAudit, setOpenAudit] = useState(false);
  const [openBin, setOpenBin] = useState(false);
  const { data: bin = [] } = useRecycleBin(isAdmin);
  const { data: logs = [] } = useAuditLogs(isAdmin);
  const { data: rates = [] } = useGovRates(isAdmin);
  const pendingRates = rates.filter((r) => r.approval_status === "pending_approval");
  const publishedRates = rates.filter((r) => r.approval_status === "published");
  const updateRate = useUpdateGovRate();
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateOffice, setRateOffice] = useState("");
  const [rateYear, setRateYear] = useState("");
  const [rateUrl, setRateUrl] = useState("");
  const [reviewingRateId, setReviewingRateId] = useState<string | null>(null);
  const restore = useRestoreRecord();
  const purge = usePurgeRecord();
  const delRate = useDeleteGovRate();
  const nameOf = (id: string | null) =>
    users.find((u) => u.id === id)?.full_name ?? users.find((u) => u.id === id)?.email ?? "System";
  const pending = users.filter(
    (u) => !u.is_verified && u.verification_status !== "rejected" && (u.nec_number || u.dean_number),
  );
  const [tab, setTab] = useState<"dashboard" | "moderation">("dashboard");
  const valuators = users.filter((u) => u.role === "valuator");
  const necVerified = users.filter((u) => u.is_verified && u.verification_type === "NEC").length;
  const deanVerified = users.filter((u) => u.is_verified && u.verification_type === "DEAN").length;
  const recentRecords = [...data]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const reviewRate = async (id: string, status: "published" | "declined") => {
    if (reviewingRateId) return;
    setReviewingRateId(id);
    try {
      await updateRate.mutateAsync({ id, approval_status: status });
      toast.success(status === "published" ? "Publication approved" : "Contribution declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review contribution");
    } finally {
      setReviewingRateId(null);
    }
  };

  const previewRate = async (pdfUrl: string) => {
    try {
      if (/^https:\/\//i.test(pdfUrl)) {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const { data, error } = await supabase.storage.from("rates").createSignedUrl(pdfUrl, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open document");
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/map", replace: true });
  }, [loading, isAdmin, navigate]);

  const reported = data.filter((r) => r.reports_count > 0);

  const save = async (args: Parameters<typeof updateUser.mutateAsync>[0]) => {
    try {
      await updateUser.mutateAsync(args);
      toast.success("User updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update user");
    }
  };

  const categories: { key: AdminRole; label: string }[] = [
    { key: "admin", label: "Admins" },
    { key: "valuator", label: "Registered Valuators" },
    { key: "guest", label: "Guests" },
  ];

  const renderUserDetail = (u: AdminUser) => (
    <div className="space-y-3 border-t border-border p-3">
      <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            NEC number
          </span>
          <input
            value={necDraft[u.id] ?? u.nec_number ?? ""}
            onChange={(e) => setNecDraft((d) => ({ ...d, [u.id]: e.target.value }))}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== (u.nec_number ?? "")) {
                void save({ id: u.id, nec_number: next || null });
              }
            }}
            placeholder="NEC-0000"
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            DEAN number
          </span>
          <input
            value={deanDraft[u.id] ?? u.dean_number ?? ""}
            onChange={(e) => setDeanDraft((d) => ({ ...d, [u.id]: e.target.value }))}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next !== (u.dean_number ?? "")) {
                void save({ id: u.id, dean_number: next || null });
              }
            }}
            placeholder="DEAN-0000"
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Role
          </span>
          <select
            value={u.role}
            onChange={(e) => void save({ id: u.id, role: e.target.value as AdminRole })}
            className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"
          >
            <option value="admin">Admin</option>
            <option value="valuator">Valuator</option>
            <option value="guest">Guest</option>
          </select>
        </label>
      </div>

      <button
        onClick={() => void save({ id: u.id, is_verified: !u.is_verified })}
        className={cn(
          "tap w-full rounded-xl py-3 text-sm font-bold",
          u.is_verified
            ? "border border-border bg-surface-2 text-foreground"
            : "gradient-brand text-primary-foreground",
        )}
      >
        {u.is_verified ? "Revoke verification" : "Mark as verified"}
      </button>
    </div>
  );

  return (
    <AppShell title="Admin Console" back>
      {isAdmin && (
        <div className="mb-3 flex rounded-2xl border border-border bg-surface p-1">
          {(["dashboard", "moderation"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "tap flex-1 rounded-xl py-2.5 text-xs font-bold capitalize transition-colors",
                tab === t ? "gradient-brand text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t === "dashboard" ? "Dashboard" : "Moderation"}
            </button>
          ))}
        </div>
      )}
      {isAdmin && tab === "dashboard" && (
        <div className="space-y-3 pb-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="surface-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total records</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{data.length + bin.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.length} active · {bin.length} in Recycle Bin
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valuators</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{usersLoading ? "…" : valuators.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {necVerified} NEC verified · {deanVerified} DEAN verified
              </p>
            </div>
            <div className="surface-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending moderation</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{pending.length + pendingRates.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pending.length} verifications · {pendingRates.length} rate contributions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTab("moderation");
                setOpenPending(true);
              }}
              className="tap gradient-brand flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground"
            >
              <UserCheck className="size-4" /> Verify Users
            </button>
            <button
              onClick={() => {
                setTab("moderation");
                setOpenRates(true);
              }}
              className="tap flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-3 text-sm font-bold text-foreground"
            >
              <FileText className="size-4" /> Review Pending Submissions
            </button>
          </div>

          <div className="surface-card p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="size-4 text-primary" /> Recent activity
            </p>
            {recentRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground">No records yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentRecords.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.location_in_cadastral_map || r.district || "Untitled record"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.creator_name} · {r.updated_at !== r.created_at ? "Updated" : "Added"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      <div className={cn("space-y-3 pb-8", isAdmin && tab !== "moderation" && "hidden")}>
        <Accordion
          open={openReported}
          onToggle={() => setOpenReported((v) => !v)}
          icon={<ShieldCheck className="size-5 text-primary" />}
          label="Reported records awaiting moderation"
          count={reported.length}
        >
          {reported.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No reported records right now.
            </p>
          ) : (
            <div className="space-y-3">
              {reported.map((r) => (
                <RecordCard key={r.id} record={r} onEdit={() => {}} />
              ))}
            </div>
          )}
        </Accordion>

        <Accordion
          open={openPending}
          onToggle={() => setOpenPending((v) => !v)}
          icon={<UserCheck className="size-5 text-primary" />}
          label="Unverified registrations (NEC / DEAN)"
          count={pending.length}
        >
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No pending registrations.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="space-y-2 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="truncate text-sm font-bold text-foreground">{u.full_name ?? "Unnamed user"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    NEC: <span className="font-semibold text-foreground">{u.nec_number ?? "—"}</span> · DEAN:{" "}
                    <span className="font-semibold text-foreground">{u.dean_number ?? "—"}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => void save({ id: u.id, is_verified: true })}
                      className="tap rounded-xl py-2.5 text-sm font-bold gradient-brand text-primary-foreground"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => void save({ id: u.id, verification_status: "rejected" })}
                      className="tap rounded-xl border border-border bg-background py-2.5 text-sm font-bold text-destructive"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Accordion>

        <Accordion
          open={openUsers}
          onToggle={() => setOpenUsers((v) => !v)}
          icon={<Users className="size-5 text-primary" />}
          label="Users"
          count={users.length}
        >
          {usersLoading && <p className="p-2 text-sm text-muted-foreground">Loading users…</p>}
          <div className="space-y-2">
            {categories.map((c) => {
              const list = users.filter((u) => u.role === c.key);
              const visible = c.key === "valuator" && valuatorFilter !== "all"
                ? list.filter((u) => u.is_verified && (u.verification_type === valuatorFilter || (!u.verification_type && (valuatorFilter === "NEC" ? Boolean(u.nec_number) : Boolean(u.dean_number)))))
                : list;
              return (
                <Accordion
                  key={c.key}
                  open={openCategory === c.key}
                  onToggle={() => setOpenCategory((v) => (v === c.key ? null : c.key))}
                  label={c.label}
                  count={list.length}
                >
                  {c.key === "valuator" && (
                    <div role="tablist" aria-label="Registered Valuators filter" className="mb-3 flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
                      {([ ["all", "All"], ["NEC", "NEC Verified"], ["DEAN", "DEAN Verified"] ] as const).map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={valuatorFilter === key} onClick={() => setValuatorFilter(key)} className={cn("tap min-w-0 flex-1 rounded-xl px-2 py-2 text-xs font-bold", valuatorFilter === key ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>{label}</button>
                      ))}
                    </div>
                  )}
                  {visible.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No users in this category.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visible.map((u) => (
                        <div
                          key={u.id}
                          className="overflow-hidden rounded-xl border border-border bg-surface-2"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenUserId((v) => (v === u.id ? null : u.id))}
                            aria-expanded={openUserId === u.id}
                            className="tap flex w-full items-center gap-2 p-3 text-left"
                          >
                            <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                              {u.full_name ?? "Unnamed user"}
                            </p>
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                                u.is_verified
                                  ? "bg-success/15 text-success"
                                  : "bg-background text-muted-foreground",
                              )}
                            >
                              <BadgeCheck className="size-3.5" />
                              {u.is_verified ? "Verified" : "Unverified"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "size-4 shrink-0 text-muted-foreground transition-transform",
                                openUserId === u.id && "rotate-180",
                              )}
                            />
                          </button>
                          {openUserId === u.id && renderUserDetail(u)}
                        </div>
                      ))}
                    </div>
                  )}
                </Accordion>
              );
            })}
          </div>
        </Accordion>

        <Accordion
          open={openRates}
          onToggle={() => setOpenRates((v) => !v)}
          icon={<FileText className="size-5 text-primary" />}
          label="Government rate contributions awaiting approval"
          count={pendingRates.length}
        >
          {pendingRates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No pending contributions.</p>
          ) : (
            <div className="space-y-2">
              {pendingRates.map((r) => (
                <div key={r.id} className="space-y-3 rounded-xl border border-border bg-surface-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{r.district_office}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      FY {r.fiscal_year} · {nameOf(r.created_by)}
                    </p>
                  </div>
                  {editingRateId === r.id ? (
                    <div className="space-y-2">
                      <label className="block text-xs text-muted-foreground">Fiscal year<input value={rateYear} onChange={(e) => setRateYear(e.target.value)} maxLength={30} className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground" /></label>
                      <label className="block text-xs text-muted-foreground">District / Office<input value={rateOffice} onChange={(e) => setRateOffice(e.target.value)} maxLength={120} className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground" /></label>
                      <label className="block text-xs text-muted-foreground">Document link or uploaded PDF path<input value={rateUrl} onChange={(e) => setRateUrl(e.target.value)} maxLength={500} className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground" /></label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setEditingRateId(null)} className="tap rounded-xl">Cancel</Button>
                        <Button disabled={updateRate.isPending || !rateOffice.trim() || !rateYear.trim() || !rateUrl.trim()} onClick={() => void run(async () => { await updateRate.mutateAsync({ id: r.id, district_office: rateOffice.trim(), fiscal_year: rateYear.trim(), pdf_url: rateUrl.trim() }); setEditingRateId(null); }, "Contribution updated")} className="tap gradient-brand rounded-xl text-primary-foreground">Save changes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => void previewRate(r.pdf_url)} className="tap rounded-xl">View document</Button>
                      <Button variant="outline" onClick={() => { setEditingRateId(r.id); setRateOffice(r.district_office); setRateYear(r.fiscal_year); setRateUrl(r.pdf_url); }} className="tap rounded-xl">Edit details</Button>
                      <Button disabled={Boolean(reviewingRateId)} onClick={() => void reviewRate(r.id, "published")} className="tap gradient-brand rounded-xl text-primary-foreground">Approve</Button>
                      <Button disabled={Boolean(reviewingRateId)} variant="outline" onClick={() => void reviewRate(r.id, "declined")} className="tap rounded-xl text-destructive">Decline</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Accordion>

        <Accordion open={openPublishedRates} onToggle={() => setOpenPublishedRates((v) => !v)} icon={<FileText className="size-5 text-primary" />} label="Published government rates" count={publishedRates.length}>
          {publishedRates.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No published contributions.</p> : (
            <div className="space-y-2">{publishedRates.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-foreground">{r.district_office}</p><p className="truncate text-xs text-muted-foreground">FY {r.fiscal_year} · {nameOf(r.created_by)}</p></div>
                <Button variant="ghost" size="icon" aria-label="Remove publication" onClick={() => { if (confirm("Remove this publication?")) void run(() => delRate.mutateAsync(r.id), "Publication removed"); }} className="tap size-10 rounded-xl border border-border bg-background text-destructive"><Trash2 className="size-4" /></Button>
              </div>
            ))}</div>
          )}
        </Accordion>

        <Accordion
          open={openAudit}
          onToggle={() => setOpenAudit((v) => !v)}
          icon={<History className="size-5 text-primary" />}
          label="Audit log"
          count={logs.length}
        >
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="rounded-xl border border-border bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm font-bold capitalize text-foreground">
                      {l.action_type.replace(/_/g, " ")}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {nameOf(l.user_id)} · {l.entity_type} · {l.entity_id?.slice(0, 8) ?? "—"}
                  </p>
                  {l.details && <p className="truncate text-xs text-muted-foreground">{l.details}</p>}
                </div>
              ))}
            </div>
          )}
        </Accordion>

        <Accordion
          open={openBin}
          onToggle={() => setOpenBin((v) => !v)}
          icon={<Trash2 className="size-5 text-primary" />}
          label="Recycle Bin"
          count={bin.length}
        >
          {bin.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Recycle Bin is empty.</p>
          ) : (
            <div className="space-y-2">
              {bin.map((r) => (
                <div key={r.id} className="space-y-2 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="truncate text-sm font-bold text-foreground">
                    {r.location_in_cadastral_map || r.district || "Untitled record"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    By {nameOf(r.created_by)} · Deleted{" "}
                    {(r as { deleted_at?: string | null }).deleted_at
                      ? new Date((r as { deleted_at?: string | null }).deleted_at!).toLocaleString()
                      : ""}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => void run(() => restore.mutateAsync(r.id), "Record restored")}
                      className="tap rounded-xl py-2.5 text-sm font-bold gradient-brand text-primary-foreground"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Permanently delete this record? This cannot be undone."))
                          void run(() => purge.mutateAsync(r.id), "Record permanently deleted");
                      }}
                      className="tap rounded-xl border border-border bg-background py-2.5 text-sm font-bold text-destructive"
                    >
                      Permanently Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Accordion>
      </div>
    </AppShell>
  );
}
