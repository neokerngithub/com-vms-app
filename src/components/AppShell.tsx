import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calculator,
  FileText,
  HelpCircle,
  Info,
  LogOut,
  Map as MapIcon,
  Menu,
  Repeat,
  Landmark,
  ShieldCheck,
  Settings,
  UserRound,
  Plus,
  BadgeCheck,
  ScrollText,
  Lock,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LegalModal, type LegalDoc } from "@/components/LegalModal";
import { useAuth } from "@/hooks/useAuth";
import { initialsOf, useAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/records", label: "Records", icon: FileText },
  { to: "/converter", label: "Converter", icon: Repeat },
] as const;

type TabPath = (typeof TABS)[number]["to"];

const MAIN_LINKS = [
  { to: "/calculator", label: "Advanced Calculator", icon: Calculator },
  { to: "/rates", label: "Government Rates Library", icon: Landmark },
] as const;

const SETTINGS_LINKS = [
  { to: "/profile", label: "App Preferences", icon: Settings },
  { to: "/support", label: "Support & Contact", icon: HelpCircle },
] as const;

const LEGAL_LINKS: { doc: LegalDoc; label: string; icon: typeof Info }[] = [
  { doc: "terms", label: "Terms of Service", icon: ScrollText },
  { doc: "privacy", label: "Privacy Policy", icon: Lock },
  { doc: "about", label: "About VMS", icon: Info },
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
  const { profile, isAdmin, signOut } = useAuth();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (TABS.some((t) => t.to === pathname)) {
      window.sessionStorage.setItem(LAST_TAB_KEY, pathname);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
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
                  <div className="border-b border-border px-5 py-6">
                    <div className="gradient-brand grid size-12 place-items-center rounded-2xl text-lg font-black text-primary-foreground">
                      V
                    </div>
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

                    <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Settings
                    </p>
                    {SETTINGS_LINKS.map((l) => (
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

                  <div className="safe-bottom border-t border-border p-3">
                    {LEGAL_LINKS.map((l) => (
                      <button
                        key={l.doc}
                        onClick={() => {
                          setOpen(false);
                          setLegal(l.doc);
                        }}
                        className="tap flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      >
                        <l.icon className="size-4 shrink-0" />
                        <span className="truncate">{l.label}</span>
                      </button>
                    ))}
                    <p className="px-3 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                      VMS v1.2.0 (Build 2026.08)
                      <br />
                      Package: com.vmsnepal.app
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open profile menu"
                className="tap grid size-11 shrink-0 place-items-center rounded-full"
              >
                <span className="gradient-brand grid size-10 place-items-center overflow-hidden rounded-full text-xs font-black text-primary-foreground ring-2 ring-border">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.full_name ?? "Profile photo"}
                      className="size-full object-cover"
                    />
                  ) : (
                    initialsOf(profile?.full_name, profile?.email)
                  )}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border-border bg-popover p-2"
            >
              <div className="flex items-center gap-3 px-2 py-2.5">
                <span className="gradient-brand grid size-11 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-black text-primary-foreground">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.full_name ?? "Profile photo"}
                      className="size-full object-cover"
                    />
                  ) : (
                    initialsOf(profile?.full_name, profile?.email)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {profile?.full_name ?? "Valuator"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile?.email ?? ""}
                  </p>
                </div>
              </div>
              <div className="px-2 pb-2">
                {profile?.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success">
                    <BadgeCheck className="size-3.5" /> Verified Valuator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    <ShieldCheck className="size-3.5" /> Unverified Valuator
                  </span>
                )}
                {isAdmin && (
                  <span className="gradient-brand ml-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    Admin
                  </span>
                )}
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild className="min-h-11 rounded-xl">
                <Link to="/profile" className="flex items-center gap-3 text-sm font-medium">
                  <UserRound className="size-4" /> Edit profile photo
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="min-h-11 rounded-xl text-sm font-semibold text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full max-w-3xl flex-1",
          bare ? "" : "px-4 pt-4",
          showTabs ? "pb-32" : "pb-10",
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
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-xl">
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

      <LegalModal doc={legal} onOpenChange={(o) => !o && setLegal(null)} />
    </div>
  );
}
