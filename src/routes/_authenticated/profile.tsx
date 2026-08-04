import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile — VMS" },
      {
        name: "description",
        content: "Your valuer account, role and contribution summary.",
      },
      { property: "og:title", content: "Profile — VMS" },
      { property: "og:description", content: "Your valuer account and contributions." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user, isAdmin, signOut } = useAuth();
  const { data = [] } = useRecords();
  const navigate = useNavigate();
  const mine = data.filter((r) => r.created_by === user?.id);

  return (
    <AppShell title="Profile" showTabs={false}>
      <div className="space-y-4 pb-8">
        <div className="surface-card flex items-center gap-4 p-5">
          <div className="gradient-brand grid size-16 shrink-0 place-items-center rounded-2xl text-2xl font-black text-primary-foreground">
            {(profile?.full_name ?? "V").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground">
              {profile?.full_name ?? "Valuer"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              {isAdmin ? "Admin" : "Valuer"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="surface-card p-4">
            <FileText className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-extrabold text-foreground">{mine.length}</p>
            <p className="text-xs text-muted-foreground">My records</p>
          </div>
          <div className="surface-card p-4">
            <FileText className="size-5 text-accent" />
            <p className="mt-3 text-2xl font-extrabold text-foreground">{data.length}</p>
            <p className="text-xs text-muted-foreground">Total records</p>
          </div>
        </div>

        <div className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Permissions
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• All records are viewable by every signed-in user.</li>
            <li>• You can edit only records you created.</li>
            <li>• Inaccurate records from others can be reported.</li>
            <li>• Only admins can delete records.</li>
          </ul>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="tap flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-surface py-3.5 text-sm font-bold text-destructive"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </AppShell>
  );
}
