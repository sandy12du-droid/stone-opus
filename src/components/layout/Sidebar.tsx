import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Sparkles,
  Users,
  UserPlus,
  Package,
  Tag,
  FileText,
  FolderKanban,
  Factory,
  Ship,
  Files,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
  Target,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";


type NavItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label?: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    items: [
      { label: "Workspace", to: "/workspace", icon: Home },
      { label: "Executive", to: "/workspace/executive", icon: LayoutDashboard },
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "AI Command Center", to: "/ai", icon: Sparkles },

  },
  {
    label: "CRM",
    items: [
      { label: "Leads", to: "/crm/leads", icon: UserPlus },
      { label: "Customers", to: "/crm/customers", icon: Users },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Pipeline", to: "/sales/pipeline", icon: Workflow },
      { label: "Opportunities", to: "/sales/opportunities", icon: Target },
    ],
  },
  {

    label: "Inventory",
    items: [
      { label: "Products", to: "/inventory/products", icon: Package },
      { label: "Pricing", to: "/inventory/pricing", icon: Tag },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Quotations", to: "/quotations", icon: FileText },
      { label: "Projects", to: "/projects", icon: FolderKanban },
      { label: "Production", to: "/production", icon: Factory },
      { label: "Shipping", to: "/shipping", icon: Ship },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Documents", to: "/documents", icon: Files },
      { label: "Reports", to: "/reports", icon: BarChart3 },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="text-[13px] font-bold tracking-tight">A</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold tracking-tight text-white">Arquane OS</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/60">
            Stone Operating System
          </span>
        </div>
      </div>

      {/* Workspace switcher */}
      <button
        type="button"
        className="mx-3 mt-1 flex items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-primary/20 text-sidebar-primary">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-white">Arquane Surfaces</div>
          <div className="truncate text-[10px] text-sidebar-foreground/60">HQ · United States</div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60" />
      </button>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group, gi) => (
          <div key={gi} className={cn("mb-4", !group.label && "mb-3")}>
            {group.label && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-sidebar-primary" : "text-sidebar-foreground/70",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-sidebar-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-white">Operator</div>
            <div className="truncate text-[10px] text-sidebar-foreground/60">Signed in</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
