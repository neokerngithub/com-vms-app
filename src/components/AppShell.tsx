import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calculator,
  FileText,
  Map as MapIcon,
  Menu,
  Repeat,
  Landmark,
  Settings,
  Plus,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LegalModal, type LegalDoc } from "@/components/LegalModal";
import { ProfileModal } from "@/components/ProfileModal";
import { useAuth } from "@/hooks/useAuth";
import { useAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/records", label: "Records", icon: FileText },
  { to: "/converter", label: "Converter", icon: Repeat },
] as const;

type TabPath = (typeof TABS)[number]["to"];

const MAIN_LINKS = [
  { to: "/calculator", label: "Advanced Calculator", icon: Calculator },
  { to: "/rates", label: "Government Rates", icon: Landmark },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const LEGAL_LINKS: { doc: LegalDoc; label: string }[] = [
  { doc: "terms", label: "Terms of Service" },
  { doc: "privacy", label: "Privacy Policy" },
  { doc: "about", label: "About VMS" },
];

const LAST_TAB_KEY = "vms-last-tab";

function readLastTab(): TabPath {
  if (typeof window === "undefined") return "/map";
  const v = window.sessionStorage.getItem(LAST_TAB_KEY);
  return (TABS.some((t) => t.to === v) ? v : "/map") as TabPath;
}

export function AppShell({
  title,
  children,
  showTabs = true,
  onAdd,
  bare = false,
  back = false,
}: {
  title: string;
  children: ReactNode;
  showTabs?: boolean;
  onAdd?: () => void;
  bare?: boolean;
  /** Secondary drawer screens show a back arrow instead of the hamburger. */
  back?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { profile } = useAuth();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (TABS.some((t) => t.to === pathname)) {
      window.sessionStorage.setItem(LAST_TAB_KEY, pathname);
    }
  }, [pathname]);

  return (
    <div className={cn("flex flex-col bg-background", bare ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]")}>
      <header className="safe-top sticky top-0 z-50 border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          {back ? (
            <button
              aria-label="Go back"
              onClick={() => navigate({ to: readLastTab() })}
              className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs border-border bg-sidebar p-0">
                <div className="safe-top flex h-full flex-col">
                  <div className="border-b border-border bg-surface px-5 py-6">
                    <img
                      src="/branding/vms-emblem-white.png"
                      alt="VMS emblem"
                      className="logo-adaptive h-12 w-auto"
                    />
                    <p className="mt-3 text-base font-bold text-foreground">
                      Valuation Management System
                    </p>
                    <p className="text-xs text-muted-foreground">Nepal land valuation toolkit</p>
                  </div>

                  <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {MAIN_LINKS.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "tap flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                          pathname === l.to && "bg-surface-2 text-foreground",
                        )}
                      >
                        <l.icon className="size-5 shrink-0" />
                        <span className="truncate">{l.label}</span>
                      </Link>
                    ))}
                  </nav>

                  <div className="safe-bottom border-t border-border px-4 py-4 text-center">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                      {LEGAL_LINKS.map((l) => (
                        <button
                          key={l.doc}
                          onClick={() => {
                            setOpen(false);
                            setLegal(l.doc);
                          }}
                          className="text-[11px] font-medium text-muted-foreground/70 underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                    <p className="pt-2 text-center text-[11px] text-muted-foreground/70">
                      VMS v1.2.0 (Build 2026.08)
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <img
            src="/branding/vms-emblem-white.png"
            alt="VMS emblem"
            className="logo-adaptive h-7 w-auto shrink-0"
          />

          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>

          <button
            aria-label="Open profile"
            onClick={() => setProfileOpen(true)}
            className="tap grid size-11 shrink-0 place-items-center rounded-full"
          >
            <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-surface-2 ring-2 ring-border">
              <img
                src={avatarUrl ?? "/branding/Round_Logo.png"}
                alt={profile?.full_name ?? "Profile photo"}
                className="size-full object-cover"
              />
            </span>
          </button>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-3xl flex-1",
          bare ? "min-h-0" : "px-4 pt-4",
          bare
            ? showTabs
              ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
              : ""
            : showTabs
              ? "pb-32"
              : "pb-10",
        )}
      >
        {children}
      </main>

      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="Add Record"
          className="tap gradient-brand fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] sm:right-[max(1rem,calc(50vw-22rem))]"
        >
          <Plus className="size-5" />
          Add Record
        </button>
      )}

      {showTabs && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-around gap-2 px-4 py-2">
            {TABS.map((t) => {
              const active = pathname === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "tap flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold",
                    active
                      ? "gradient-brand text-primary-foreground shadow-[var(--shadow-glow)]"
                      : "text-muted-foreground",
                  )}
                >
                  <t.icon className="size-5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      <LegalModal doc={legal} onOpenChange={(o) => !o && setLegal(null)} />
    </div>
  );
}
