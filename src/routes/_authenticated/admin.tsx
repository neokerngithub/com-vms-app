import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { BadgeCheck, ChevronDown, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RecordCard } from "@/components/RecordCard";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
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
        content: "Moderate reported valuation records and approve NEC valuators.",
      },
      { property: "og:title", content: "Admin Management Console — VMS" },
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
  const [openUserId, setOpenUserId] = useState<string | null>(null);

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

      <div className="grid gap-2 sm:grid-cols-2">
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
      <div className="space-y-3 pb-8">
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
              return (
                <Accordion
                  key={c.key}
                  open={openCategory === c.key}
                  onToggle={() => setOpenCategory((v) => (v === c.key ? null : c.key))}
                  label={c.label}
                  count={list.length}
                >
                  {list.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No users in this category.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {list.map((u) => (
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
      </div>
    </AppShell>
  );
}
