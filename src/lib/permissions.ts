import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  staff: "Staff",
  sales: "Sales",
  production: "Production",
  logistics: "Logistics",
  viewer: "Viewer",
};

/** Modules map 1:1 to top-level route segments. */
export type ModuleKey =
  | "workspace"
  | "dashboard"
  | "ai"
  | "crm"
  | "sales"
  | "inventory"
  | "quotations"
  | "projects"
  | "production"
  | "shipping"
  | "documents"
  | "reports"
  | "settings";

export const MODULE_LABEL: Record<ModuleKey, string> = {
  workspace: "Workspace",
  dashboard: "Dashboard",
  ai: "AI Command Center",
  crm: "CRM",
  sales: "Sales",
  inventory: "Inventory",
  quotations: "Quotations",
  projects: "Projects",
  production: "Production",
  shipping: "Shipping",
  documents: "Documents",
  reports: "Reports",
  settings: "Settings",
};

const ALL_MODULES = Object.keys(MODULE_LABEL) as ModuleKey[];

export const ROLE_MODULES: Record<AppRole, ModuleKey[]> = {
  admin: ALL_MODULES,
  manager: ALL_MODULES.filter((m) => m !== "settings"),
  staff: [
    "workspace",
    "dashboard",
    "ai",
    "crm",
    "sales",
    "inventory",
    "quotations",
    "projects",
    "production",
    "shipping",
    "documents",
  ],
  sales: [
    "workspace",
    "dashboard",
    "ai",
    "crm",
    "sales",
    "inventory",
    "quotations",
    "projects",
    "documents",
  ],
  production: [
    "workspace",
    "dashboard",
    "production",
    "projects",
    "inventory",
    "quotations",
    "documents",
  ],
  logistics: [
    "workspace",
    "dashboard",
    "shipping",
    "projects",
    "inventory",
    "documents",
  ],
  viewer: ["workspace", "dashboard", "reports", "documents"],
};

/** Users with no assigned role get the least-privileged role. */
export const DEFAULT_ROLE: AppRole = "viewer";

export function moduleForPath(pathname: string): ModuleKey | null {
  const segment = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
  return (ALL_MODULES as string[]).includes(segment)
    ? (segment as ModuleKey)
    : null;
}

export function allowedModules(roles: AppRole[]): ModuleKey[] {
  const effective = roles.length > 0 ? roles : [DEFAULT_ROLE];
  const set = new Set<ModuleKey>();
  for (const role of effective) {
    for (const m of ROLE_MODULES[role] ?? []) set.add(m);
  }
  return ALL_MODULES.filter((m) => set.has(m));
}

export function canAccessModule(roles: AppRole[], moduleKey: ModuleKey | null) {
  if (!moduleKey) return true;
  return allowedModules(roles).includes(moduleKey);
}

export function canAccessPath(roles: AppRole[], pathname: string) {
  // The audit log screen is administrator-only regardless of module access.
  if (pathname.startsWith("/settings/audit-logs")) return roles.includes("admin");
  return canAccessModule(roles, moduleForPath(pathname));
}

/** Safe internal redirect target — never allow off-site URLs. */
export function sanitizeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.startsWith("/login") || value.startsWith("/forgot-password")) return undefined;
  return value;
}
