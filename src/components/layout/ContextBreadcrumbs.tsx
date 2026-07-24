/**
 * ContextBreadcrumbs — renders below the top bar on every AppShell page.
 *
 * Builds crumbs from two sources:
 *  1. The current route pathname (Workspace › Customers › …)
 *  2. The active Business Context entity relevant to this route
 *     (Workspace › Customers › ABC Stone)
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import {
  useBusinessContext,
  type BusinessEntityKind,
} from "@/context/BusinessContext";

type Crumb = { label: string; to?: string };

/**
 * Maps a top-level route segment to a friendly label. Extending this map
 * is the entire cost of adding a new section to the breadcrumbs.
 */
const SEGMENT_LABELS: Record<string, string> = {
  workspace: "Workspace",
  dashboard: "Dashboard",
  ai: "AI Command Center",
  crm: "CRM",
  customers: "Customers",
  leads: "Leads",
  sales: "Sales",
  pipeline: "Pipeline",
  opportunities: "Opportunities",
  inventory: "Inventory",
  products: "Products",
  pricing: "Pricing",
  quotations: "Quotations",
  projects: "Projects",
  production: "Production",
  shipping: "Shipping",
  documents: "Documents",
  reports: "Reports",
  settings: "Settings",
};

/**
 * When the URL contains a dynamic id (uuid, code, hash), swap it for the
 * active entity's label from the Business Context.
 */
const SEGMENT_TO_ENTITY: Record<string, BusinessEntityKind> = {
  quotations: "quotation",
  projects: "project",
  products: "inventory",
  shipping: "container",
  customers: "customer",
  leads: "lead",
};

function looksLikeId(seg: string) {
  return (
    seg.length >= 8 &&
    (/^[0-9a-f-]{8,}$/i.test(seg) || /\d/.test(seg))
  );
}

export function ContextBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { active } = useBusinessContext();

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [{ label: "Workspace", to: "/workspace" }];
  let acc = "";
  let lastEntityKind: BusinessEntityKind | null = null;

  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const parent = segments[i - 1];
    if (parent && SEGMENT_TO_ENTITY[parent] && looksLikeId(seg)) {
      const kind = SEGMENT_TO_ENTITY[parent];
      lastEntityKind = kind;
      const entity = active[kind];
      crumbs.push({ label: entity?.label ?? seg });
      return;
    }
    const label = SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ");
    // Skip the leading /workspace so we don't render "Workspace › Workspace".
    if (i === 0 && seg === "workspace") return;
    crumbs.push({ label, to: i < segments.length - 1 ? acc : undefined });
  });

  // If the page never resolved into a detail id but a matching entity is
  // still active in context (e.g. list page after opening a record), append it
  // so cross-module context stays visible.
  if (!lastEntityKind) {
    const lastSeg = segments[segments.length - 1];
    const parentSeg = segments[segments.length - 2];
    const kindFromLast = SEGMENT_TO_ENTITY[lastSeg];
    const kindFromParent = parentSeg ? SEGMENT_TO_ENTITY[parentSeg] : undefined;
    const kind = kindFromLast ?? kindFromParent;
    if (kind && active[kind]) {
      crumbs.push({ label: active[kind]!.label });
    }
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-border bg-background/60 px-6 py-2"
    >
      <ol className="mx-auto flex w-full max-w-[1400px] items-center gap-1 text-[12px] text-muted-foreground">
        <li className="flex items-center">
          <Link
            to="/workspace"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-muted hover:text-foreground"
            aria-label="Workspace home"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              {c.to && !isLast ? (
                <Link
                  to={c.to}
                  className="rounded px-1.5 py-0.5 hover:bg-surface-muted hover:text-foreground"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "px-1.5 py-0.5 font-medium text-foreground"
                      : "px-1.5 py-0.5"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
