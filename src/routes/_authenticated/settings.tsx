import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  LifeBuoy,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
} from "lucide-react";

const CONTACTS = [
  {
    icon: Mail,
    label: "Email",
    value: "vms.app.nepal@gmail.com",
    href: "mailto:vms.app.nepal@gmail.com",
  },
  { icon: Phone, label: "Phone", value: "+977-9852059599", href: "tel:+9779852059599" },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+977-9852059599",
    href: "https://wa.me/9779852059599",
  },
] as const;
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useRecords } from "@/hooks/useRecords";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — VMS" },
      {
        name: "description",
        content: "App preferences, contribution summary and record permission rules in VMS.",
      },
      { property: "og:title", content: "Settings — VMS" },
      { property: "og:description", content: "App preferences and permissions for VMS." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data = [] } = useRecords();
  const { theme, setTheme } = useTheme();
  const mine = data.filter((r) => r.created_by === user?.id);

  return (
    <AppShell title="Settings" back>
      <div className="space-y-4 pb-8">
        <div id="preferences" className="surface-card scroll-mt-24 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            App Preferences
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Appearance</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <div className="flex shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
              {(
                [
                  { key: "dark", label: "Dark", Icon: Moon },
                  { key: "light", label: "Light", Icon: Sun },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setTheme(o.key)}
                  aria-pressed={theme === o.key}
                  className={cn(
                    "tap flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold",
                    theme === o.key
                      ? "gradient-brand text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <o.Icon className="size-4" />
                  {o.label}
                </button>
              ))}
            </div>
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

        <div id="support" className="surface-card scroll-mt-24 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <LifeBuoy className="size-4" /> Support & Contact
          </p>
          <div className="mt-3 space-y-2">
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="tap grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
              >
                <c.icon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-muted-foreground">{c.label}</span>
                  <span className="block truncate text-sm font-bold text-foreground">
                    {c.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div id="permissions" className="surface-card scroll-mt-24 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-4" /> Permissions & Reporting
          </p>
          <p className="mt-2 text-sm font-bold text-foreground">
            Secure Data Governance — Creator-managed edits with admin moderation
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• All records are viewable by every signed-in user.</li>
            <li>• You can edit only records you created.</li>
            <li>• Inaccurate records from others can be reported with a description.</li>
            <li>• Only admins can delete records.</li>
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            Use the flag icon on any record you did not create and describe the issue in at
            least 10 characters. Flagged records are reviewed by administrators.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
