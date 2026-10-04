import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TabActiveContext } from "@/components/AppShell";
import { MapTab } from "@/components/tabs/MapTab";
import { RecordsTab } from "@/components/tabs/RecordsTab";
import { ConverterTab } from "@/components/tabs/ConverterTab";

const KEEP_ALIVE: Record<string, () => ReactNode> = {
  "/map": () => <MapTab />,
  "/records": () => <RecordsTab />,
  "/converter": () => <ConverterTab />,
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Local session read: avoids a network round-trip (and a blank frame) on every navigation.
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState<string[]>([]);
  if (KEEP_ALIVE[pathname] && !mounted.includes(pathname)) {
    setMounted((m) => [...m, pathname]);
  }
  const isTab = !!KEEP_ALIVE[pathname];

  return (
    <>
      {mounted.map((path) => (
        <div key={path} className={path === pathname ? undefined : "hidden"}>
          <TabActiveContext.Provider value={path === pathname}>
            {KEEP_ALIVE[path]!()}
          </TabActiveContext.Provider>
        </div>
      ))}
      {!isTab && <Outlet />}
    </>
  );
}
