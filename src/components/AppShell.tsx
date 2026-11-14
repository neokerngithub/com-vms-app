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

  const navItem = (to: string, label: string, Icon: typeof MapIcon, onClick?: () => void) => {
    const active = pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          "tap flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
          collapsed && !onClick && "justify-center px-0",
        )}
      >
        <Icon className="size-5 shrink-0" />
        {(!collapsed || onClick) && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const navContent = (mobile: boolean) => {
    const close = mobile ? () => setOpen(false) : undefined;
    const showText = mobile || !collapsed;
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex items-center gap-3 border-b border-border h-12 px-4", !showText && "justify-center px-2")}>
          <img src="/branding/vms-emblem-white.png" alt="VMS emblem" className="logo-adaptive h-6 w-auto shrink-0" />
          {showText && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Valuation Management</p>
              <p className="truncate text-[11px] text-muted-foreground">Nepal land valuation toolkit</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {showText && <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Workspace</p>}
          {NAV_LINKS.map((l) => navItem(l.to, l.label, l.icon, close))}
          {isAdmin && (
            <>
              {showText && <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Administration</p>}
              {navItem(ADMIN_LINK.to, ADMIN_LINK.label, ADMIN_LINK.icon, close)}
            </>
          )}
        </nav>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-sidebar transition-[width] duration-200 md:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {navContent(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border bg-surface">
          <div className="flex h-12 items-center gap-2 px-3">
            <button
              aria-label="Toggle menu"
              onClick={toggleCollapsed}
              className="hidden size-8 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground md:grid"
            >
              {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground md:hidden">
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs border-border bg-sidebar p-0">
                {navContent(true)}
              </SheetContent>
            </Sheet>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</h1>
          </div>
        </header>

        <main className={cn("page-transition relative min-h-0 flex-1", bare ? "overflow-hidden" : "overflow-y-auto")}>
          {bare ? children : <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">{children}</div>}
        </main>
      </div>

      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="Add Record"
          className="tap gradient-brand fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Plus className="size-5" />
          Add Record
        </button>
      )}

      {extraFloatingActions}

    </div>
  );
}
