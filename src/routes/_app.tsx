import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import AppShell from "@/components/app/shell";
import { FarmProvider } from "@/lib/farm-store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app")({
  // Session lives in browser storage, so the gate runs client-side only.
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile?.onboarded) throw redirect({ to: "/onboarding" });
    return { userId: data.user.id };
  },
  component: AppLayout,
});

function AppLayout() {
  const { userId } = Route.useRouteContext();
  return (
    <FarmProvider userId={userId}>
      <AppShell>
        <Outlet />
      </AppShell>
    </FarmProvider>
  );
}
