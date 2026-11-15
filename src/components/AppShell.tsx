import { Link, useRouterState } from "@tanstack/react-router";
import {
  Calculator,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Map as MapIcon,
  Menu,
  Repeat,
  Landmark,
  Settings,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { createContext, useEffect, useState, type ReactNode } from "react";

/** False while a kept-alive tab is hidden, so it ignores drawer/back side-effects. */
export const TabActiveContext = createContext(true);
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/map", label: "Universal Map", icon: MapIcon },
  { to: "/records", label: "Records", icon: FileText },
  { to: "/converter", label: "Unit Converter", icon: Repeat },
  { to: "/calculator", label: "Advanced Calculator", icon: Calculator },
  { to: "/rates", label: "Government Rates", icon: Landmark },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const COLLAPSE_KEY = "vms-sidebar-collapsed";

const ADMIN_LINK = {
  to: "/admin",
  label: "Admin Management Console",
  icon: ShieldCheck,
} as const;


export function AppShell({
  title,
  children,
  showTabs = true,
  onAdd,
  extraFloatingActions,
  bare = false,
  back = false,
}: {
  title: string;
  children: ReactNode;
  showTabs?: boolean;
  onAdd?: () => void;
  extraFloatingActions?: ReactNode;
  bare?: boolean;
  /** Secondary drawer screens show a back arrow instead of the hamburger. */
  back?: boolean;
}) {

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  void showTabs;
  void back;

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      window.localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      window.dispatchEvent(new Event("resize"));
      return !c;
    });
  };

  const navItem = (to: string, label: string, Icon: typeof MapIcon, index: number, onClick?: () => void) => {
    const active = pathname === to;
    const expanded = !collapsed || !!onClick;
    return (
      <Link
        key={to}
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          "tap group relative flex items-center gap-3 px-4 py-2 text-[13px] font-medium",
          active ? "nav-active bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
          !expanded && "justify-center px-0",
        )}
      >
        {expanded && (
          <span className={cn("w-5 font-mono text-[10px]", active ? "text-primary" : "text-muted-foreground/50")}>
            {String(index).padStart(2, "0")}
          </span>
        )}
        <Icon className={cn("size-4 shrink-0", active && "text-brand-indigo-soft")} strokeWidth={1.75} />
        {expanded && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const navContent = (mobile: boolean) => {
    const close = mobile ? () => setOpen(false) : undefined;
    const showText = mobile || !collapsed;
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex h-12 items-center gap-3 border-b border-sidebar-border px-4", !showText && "justify-center px-2")}>
          <img src="/branding/vms-emblem-white.png" alt="VMS emblem" className="logo-adaptive h-5 w-auto shrink-0" />
          {showText && (
            <div className="min-w-0 leading-none">
              <p className="truncate font-mono text-[12px] font-semibold tracking-[0.18em] text-foreground">VMS</p>
              <p className="mt-1 truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Cadastral Workstation</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {showText && <p className="mono-label px-4 pb-2">Modules</p>}
          {NAV_LINKS.map((l, i) => navItem(l.to, l.label, l.icon, i + 1, close))}
          {isAdmin && (
            <>
              {showText && <p className="mono-label px-4 pb-2 pt-5">Administration</p>}
              {navItem(ADMIN_LINK.to, ADMIN_LINK.label, ADMIN_LINK.icon, NAV_LINKS.length + 1, close)}
            </>
          )}
        </nav>
        {showText && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="mono-label">Datum</p>
            <p className="mt-1 font-mono text-[11px] text-foreground">WGS 84 · Nepal</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:block",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        {navContent(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border bg-background">
          <div className="flex h-12 items-center gap-3 px-3 md:px-5">
            <button
              aria-label="Toggle menu"
              onClick={toggleCollapsed}
              className="hidden size-8 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground md:grid"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="grid size-8 shrink-0 place-items-center rounded-sm border border-border bg-surface text-foreground md:hidden">
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs border-border bg-sidebar p-0">
                {navContent(true)}
              </SheetContent>
            </Sheet>
            <div className="hidden h-5 w-px bg-border md:block" />
            <div className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">VMS /</span>
              <h1 className="truncate text-[14px] font-semibold text-foreground">{title}</h1>
            </div>
            <span className="hidden items-center gap-2 border border-border px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground lg:flex">
              <span className="size-1.5 bg-success" /> Live
            </span>
          </div>
        </header>

        <main className={cn("page-transition relative min-h-0 flex-1 survey-grid", bare ? "overflow-hidden" : "overflow-y-auto")}>
          {bare ? children : <div className="mx-auto w-full max-w-[1360px] px-4 pb-16 pt-5 md:px-6">{children}</div>}
        </main>
      </div>

      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="Add Record"
          className="tap gradient-brand fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-sm px-4 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Plus className="size-5" />
          Add Record
        </button>
      )}

      {extraFloatingActions}

    </div>
  );
}
