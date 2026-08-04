import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Calculator,
  FileText,
  HelpCircle,
  LogOut,
  Map as MapIcon,
  Menu,
  Repeat,
  Landmark,
  UserRound,
  Plus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/records", label: "Records", icon: FileText },
  { to: "/converter", label: "Converter", icon: Repeat },
] as const;

const DRAWER_LINKS = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/calculator", label: "Advanced Calculator", icon: Calculator },
  { to: "/rates", label: "Government Rates Library", icon: Landmark },
  { to: "/support", label: "Support / Contact", icon: HelpCircle },
] as const;

export function AppShell({
  title,
  children,
  showTabs = true,
  onAdd,
  bare = false,
}: {
  title: string;
  children: ReactNode;
  showTabs?: boolean;
  onAdd?: () => void;
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="safe-top sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open menu"
                className="tap grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground"
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
                  <p className="mt-3 truncate text-base font-bold text-foreground">
                    {profile?.full_name ?? "Valuer"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile?.email ?? ""}
                  </p>
                  {isAdmin && (
                    <span className="gradient-brand mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                      Admin
                    </span>
                  )}
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                  {DRAWER_LINKS.map((l) => (
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
                  <button
                    onClick={handleSignOut}
                    className="tap flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive hover:bg-surface-2"
                  >
                    <LogOut className="size-5 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>

          <div className="gradient-brand grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black text-primary-foreground">
            VMS
          </div>
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
                    "tap flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold",
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
    </div>
  );
}
