import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ROLE, type AppRole } from "@/lib/permissions";

export async function fetchCurrentRoles(): Promise<AppRole[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error) return [DEFAULT_ROLE];
  const roles = (data ?? []).map((r) => r.role as AppRole);
  return roles.length > 0 ? roles : [DEFAULT_ROLE];
}

export function useRoles() {
  const query = useQuery({
    queryKey: ["auth", "roles"],
    queryFn: fetchCurrentRoles,
    staleTime: 60_000,
  });
  const roles = query.data ?? [];
  return {
    roles,
    isLoading: query.isLoading,
    isAdmin: roles.includes("admin"),
  };
}
