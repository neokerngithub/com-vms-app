import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Fetch profile once at the layout route level
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    return { 
      user: data.user,
      profile: profile || null,
      avatarUrl: data.user.user_metadata?.avatar_url || profile?.avatar_url || null,
    };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const context = Route.useRouteContext();
  return <Outlet context={context} />;
}
