import { createFileRoute, Outlet, redirect, useRouterState, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCurrentRoles } from "@/hooks/use-roles";
import { canAccessPath, allowedModules, MODULE_LABEL, ROLE_LABEL } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    const roles = await fetchCurrentRoles();
    return { user: data.user, roles };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { roles } = Route.useRouteContext() as { roles: AppRole[] };
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!canAccessPath(roles, pathname)) {
    return <AccessDenied roles={roles} />;
  }

  return <Outlet />;
}

function AccessDenied({ roles }: { roles: AppRole[] }) {
  const modules = allowedModules(roles);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
          You don't have access to this module
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your role{roles.length > 1 ? "s" : ""}{" "}
          <span className="font-medium text-foreground">
            {roles.map((r) => ROLE_LABEL[r]).join(", ")}
          </span>{" "}
          can access: {modules.map((m) => MODULE_LABEL[m]).join(", ")}. Ask a workspace
          administrator if you need broader permissions.
        </p>
        <Button asChild className="mt-6">
          <Link to="/workspace">Go to workspace</Link>
        </Button>
      </div>
    </main>
  );
}
