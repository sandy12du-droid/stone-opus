import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Home,
  Sparkles,
  UserPlus,
  Users,
  Package,
  Tag,
  FileText,
  FolderKanban,
  Factory,
  Ship,
  Files,
  BarChart3,
  Settings,
  Workflow,
  Target,
  Boxes,
  Receipt,
  Container,
} from "lucide-react";

type Nav = { label: string; to: string; icon: React.ComponentType<{ className?: string }>; group: string; keywords?: string };

const navItems: Nav[] = [
  { label: "Workspace", to: "/workspace", icon: Home, group: "Navigate" },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "AI Command Center", to: "/ai", icon: Sparkles, group: "Navigate" },
  { label: "Leads", to: "/crm/leads", icon: UserPlus, group: "CRM" },
  { label: "Customers", to: "/crm/customers", icon: Users, group: "CRM" },
  { label: "Sales Pipeline", to: "/sales/pipeline", icon: Workflow, group: "Sales" },
  { label: "Opportunities", to: "/sales/opportunities", icon: Target, group: "Sales" },
  { label: "Products", to: "/inventory/products", icon: Package, group: "Inventory" },
  { label: "Pricing", to: "/inventory/pricing", icon: Tag, group: "Inventory" },
  { label: "Quotations", to: "/quotations", icon: FileText, group: "Operations" },
  { label: "Projects", to: "/projects", icon: FolderKanban, group: "Operations" },
  { label: "Production", to: "/production", icon: Factory, group: "Operations" },
  { label: "Shipping", to: "/shipping", icon: Ship, group: "Operations" },
  { label: "Documents", to: "/documents", icon: Files, group: "Insights" },
  { label: "Reports", to: "/reports", icon: BarChart3, group: "Insights" },
  { label: "Settings", to: "/settings", icon: Settings, group: "Insights" },
];

// Mock cross-domain entities so ⌘K feels universal.
type Entity = { label: string; sub: string; to: string; icon: React.ComponentType<{ className?: string }>; group: string; keywords?: string };
const entities: Entity[] = [
  { label: "White Carrara", sub: "Marble · 240 slabs · Livorno", to: "/inventory/products", icon: Package, group: "Inventory", keywords: "marble italy stone" },
  { label: "Calacatta Oro", sub: "Marble · 96 slabs · Warehouse B", to: "/inventory/products", icon: Package, group: "Inventory", keywords: "marble gold" },
  { label: "Statuario Extra 20mm", sub: "Low stock · 3 slabs", to: "/inventory/products", icon: Package, group: "Inventory", keywords: "marble alert" },
  { label: "Riverside Kitchens", sub: "Customer · United States · $184k open", to: "/crm/customers", icon: Users, group: "Customers", keywords: "usa kitchen" },
  { label: "Concord Stoneworks", sub: "Lead · Texas · Discovery", to: "/crm/leads", icon: UserPlus, group: "Customers", keywords: "usa texas" },
  { label: "Doha Interiors", sub: "Customer · Qatar · Sample review", to: "/crm/customers", icon: Users, group: "Customers", keywords: "qatar middle east" },
  { label: "Q-2418", sub: "Quotation · Riverside Kitchens · Approved", to: "/quotations", icon: FileText, group: "Documents", keywords: "quote invoice" },
  { label: "PRJ-118 · Ashford Residence", sub: "Project · Shop drawing uploaded", to: "/projects", icon: FolderKanban, group: "Documents", keywords: "drawing" },
  { label: "INV-2210", sub: "Invoice · $92k · Alba Marmi", to: "/documents", icon: Receipt, group: "Documents", keywords: "invoice italy" },
  { label: "CNT-0091 · MSC Loreto", sub: "Container · Dispatched", to: "/shipping", icon: Container, group: "Shipping", keywords: "container dispatch" },
  { label: "CNT-0092", sub: "Container · Consolidating 4 POs", to: "/shipping", icon: Container, group: "Shipping", keywords: "container loading" },
];

const actions = [
  { label: "New lead", to: "/crm/leads", icon: UserPlus },
  { label: "New quotation", to: "/quotations", icon: FileText },
  { label: "Add inventory", to: "/inventory/products", icon: Boxes },
  { label: "Upload drawing", to: "/projects", icon: Files },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette = () => setOpen(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      delete (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette;
    };
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const grouped = <T extends { group: string }>(arr: T[]) =>
    arr.reduce<Record<string, T[]>>((acc, item) => {
      (acc[item.group] ||= []).push(item);
      return acc;
    }, {});

  const navByGroup = grouped(navItems);
  const entByGroup = grouped(entities);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search leads, quotations, slabs, documents, containers…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          {actions.map((a) => (
            <CommandItem key={a.label} value={`action ${a.label}`} onSelect={() => go(a.to)}>
              <a.icon className="mr-2 h-4 w-4 text-primary" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {Object.entries(entByGroup).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((it) => (
              <CommandItem
                key={it.label}
                value={`${it.label} ${it.sub} ${it.keywords ?? ""}`}
                onSelect={() => go(it.to)}
              >
                <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">{it.label}</span>
                  <span className="text-[11px] text-muted-foreground">{it.sub}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {Object.entries(navByGroup).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((it) => (
              <CommandItem key={it.to} value={`nav ${it.label}`} onSelect={() => go(it.to)}>
                <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {it.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

export function openCommandPalette() {
  (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette?.();
}
