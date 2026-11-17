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

  const navItem = (to: string, label: string, Icon: typeof MapIcon, _index: number, onClick?: () => void) => {
    const active = pathname === to;
    const expanded = !collapsed || !!onClick;
    return (
      <Link
        key={to}
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
          "nav-link tap flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-semibold",
          active && "is-active",
          !expanded && "justify-center px-0",
        )}
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={2} />
        {expanded && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  const navContent = (mobile: boolean) => {
    const close = mobile ? () => setOpen(false) : undefined;
    const showText = mobile || !collapsed;
    return (
      <div className="sidebar-dark flex h-full flex-col">
        <div className={cn("flex h-16 items-center gap-3 px-5", !showText && "justify-center px-2")}>
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary">
            <img src="/branding/vms-emblem-white.png" alt="VMS emblem" className="h-5 w-auto" />
          </div>
          {showText && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[15px] font-extrabold tracking-tight">VMS</p>
              <p className="truncate text-[11px] font-medium text-[#8a8a8a]">Valuation Management</p>
            </div>
          )}
        </div>
        <nav className={cn("flex-1 space-y-1 overflow-y-auto px-3 py-4", !showText && "px-2")}>
          {showText && <p className="mono-label px-3 pb-2">Workspace</p>}
          {NAV_LINKS.map((l, i) => navItem(l.to, l.label, l.icon, i + 1, close))}
          {isAdmin && (
            <>
              {showText && <p className="mono-label px-3 pb-2 pt-6">Administration</p>}
              {navItem(ADMIN_LINK.to, ADMIN_LINK.label, ADMIN_LINK.icon, NAV_LINKS.length + 1, close)}
            </>
          )}
        </nav>
        {showText && (
          <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-4">
            <p className="text-[12.5px] font-bold">Nepal Valuation Suite</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[#8a8a8a]">Ropani · Bigha · Govt. rates, in one workspace.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "hidden shrink-0 bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {navContent(false)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-40 shrink-0 border-b border-border bg-card">
          <div className="flex h-16 items-center gap-3 px-3 md:px-5">
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
              <h1 className="truncate text-[18px] font-extrabold tracking-tight text-foreground">{title}</h1>
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[12px] font-semibold text-muted-foreground lg:flex">
              <span className="size-2 rounded-full bg-success" /> All systems operational
            </span>
          </div>
        </header>

        <main className={cn("page-transition relative min-h-0 flex-1 survey-grid", bare ? "overflow-hidden" : "overflow-y-auto")}>
          {bare ? children : <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 md:px-8">{children}</div>}
        </main>
      </div>

      {onAdd && (
        <button
          onClick={onAdd}
          aria-label="Add Record"
          className="tap gradient-brand fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-full px-5 py-3 text-[13.5px] font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Plus className="size-5" />
          Add Record
        </button>
      )}

      {extraFloatingActions}

    </div>
  );
}
