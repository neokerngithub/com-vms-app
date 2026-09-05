import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RecordCard } from "@/components/RecordCard";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
import { useAdminUsers, useUpdateAdminUser, type AdminRole } from "@/hooks/useAdminUsers";
import { cn } from "@/lib/utils";

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
  const { data: users = [], isLoading: usersLoading } = useAdminUsers(isAdmin);
  const updateUser = useUpdateAdminUser();
  const navigate = useNavigate();
  const [necDraft, setNecDraft] = useState<Record<string, string>>({});

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

      <div className="surface-card mb-4 mt-8 flex items-center gap-3 p-4">
        <Users className="size-5 text-primary" />
        <p className="text-sm font-semibold text-foreground">Users</p>
      </div>

      {usersLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}

      <div className="space-y-3 pb-8">
        {users.map((u) => (
          <div key={u.id} className="surface-card space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {u.full_name ?? "Unnamed user"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email ?? "—"}</p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold",
                  u.is_verified
                    ? "bg-success/15 text-success"
                    : "bg-surface-2 text-muted-foreground",
                )}
              >
                <BadgeCheck className="size-3.5" />
                {u.is_verified ? "Verified" : "Unverified"}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  NEC number
                </span>
                <input
                  value={necDraft[u.id] ?? u.nec_number ?? ""}
                  onChange={(e) =>
                    setNecDraft((d) => ({ ...d, [u.id]: e.target.value }))
                  }
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
        ))}
      </div>
    </AppShell>
  );
}
