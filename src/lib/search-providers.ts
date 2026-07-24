// Universal search provider registry.
//
// Each provider returns groups of results for a given query. Providers are
// pure functions so modules can register their own without touching the
// palette component. Swap the static datasets for Supabase queries later —
// the shape stays the same.

import type { ComponentType } from "react";
import {
  Package,
  Users,
  UserPlus,
  FileText,
  FolderKanban,
  Ship,
  Container,
  Files,
  Globe2,
  Boxes,
  Receipt,
  Sparkles,
  Tag,
} from "lucide-react";
import { CUSTOMERS } from "@/lib/crm-data";

export type SearchIcon = ComponentType<{ className?: string }>;

export type SearchResultKind =
  | "customer"
  | "lead"
  | "project"
  | "quotation"
  | "order"
  | "inventory"
  | "product"
  | "container"
  | "document"
  | "country"
  | "command";

export interface SearchResult {
  /** Stable id — `${kind}:${id}`. Used for pins + recents. */
  key: string;
  kind: SearchResultKind;
  label: string;
  sub?: string;
  href: string;
  icon: SearchIcon;
  group: string;
  keywords?: string;
}

export interface SearchProvider {
  id: string;
  /** Human label used as group header when the provider returns loose items. */
  label: string;
  search: (query: string) => SearchResult[];
}

const norm = (s: string) => s.toLowerCase();
const matches = (q: string, hay: string) => hay.toLowerCase().includes(q);

// -- Providers ----------------------------------------------------------------

const customersProvider: SearchProvider = {
  id: "customers",
  label: "Customers",
  search: (q) =>
    CUSTOMERS.filter(
      (c) =>
        !q ||
        matches(q, `${c.name} ${c.country} ${c.city ?? ""} ${c.segment} ${c.tier}`),
    ).map<SearchResult>((c) => ({
      key: `customer:${c.id}`,
      kind: "customer",
      label: c.name,
      sub: `${c.flag} ${c.country} · ${c.segment} · ${c.tier}`,
      href: `/crm/customers/${c.id}`,
      icon: Users,
      group: "Customers",
      keywords: `${c.country} ${c.city ?? ""} ${c.segment}`,
    })),
};

// Mock datasets kept in-file for now. Move to Supabase-backed providers later.
const leads = [
  { id: "L-2201", name: "Concord Stoneworks", sub: "Texas · Discovery" },
  { id: "L-2198", name: "Doha Interiors", sub: "Qatar · Sample review" },
  { id: "L-2190", name: "Nordic Kitchens", sub: "Sweden · Qualified" },
];

const projects = [
  { id: "PRJ-118", name: "Ashford Residence", sub: "Riverside Kitchens · Shop drawing" },
  { id: "PRJ-117", name: "Hilton Tower Lobby", sub: "Al Habtoor Marble · Templating" },
  { id: "PRJ-115", name: "Marina Bay Villas", sub: "Osaka Ishi · Production" },
];

const quotations = [
  { id: "Q-2418", name: "Q-2418", sub: "Riverside Kitchens · Approved · $184k" },
  { id: "Q-2417", name: "Q-2417", sub: "Vittoria Stone · Sent · $92k" },
  { id: "Q-2415", name: "Q-2415", sub: "Al Habtoor · Draft · $310k" },
];

const orders = [
  { id: "O-4408", name: "O-4408", sub: "Vittoria Stone · In production" },
  { id: "O-4407", name: "O-4407", sub: "Osaka Ishi · Ready to ship" },
];

const products = [
  { id: "P-901", name: "White Carrara", sub: "Marble · 240 slabs · Livorno" },
  { id: "P-902", name: "Calacatta Oro", sub: "Marble · 96 slabs · Warehouse B" },
  { id: "P-903", name: "Statuario Extra 20mm", sub: "Low stock · 3 slabs" },
  { id: "P-904", name: "Nero Marquina", sub: "Marble · 58 slabs · Dubai" },
];

const containers = [
  { id: "CNT-0091", name: "CNT-0091 · MSC Loreto", sub: "Container · Dispatched" },
  { id: "CNT-0092", name: "CNT-0092", sub: "Container · Consolidating 4 POs" },
];

const documents = [
  { id: "INV-2210", name: "INV-2210", sub: "Invoice · $92k · Alba Marmi" },
  { id: "BOL-1108", name: "BOL-1108", sub: "Bill of lading · CNT-0091" },
];

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
];

const commands: Array<{
  id: string;
  label: string;
  href: string;
  icon: SearchIcon;
  keywords?: string;
}> = [
  { id: "new-lead", label: "New lead", href: "/crm/leads", icon: UserPlus, keywords: "create add" },
  { id: "new-quotation", label: "New quotation", href: "/quotations", icon: FileText, keywords: "create quote" },
  { id: "add-inventory", label: "Add inventory", href: "/inventory/products", icon: Boxes, keywords: "slab stone" },
  { id: "upload-drawing", label: "Upload drawing", href: "/projects", icon: Files, keywords: "shop drawing project" },
  { id: "ask-ai", label: "Ask Arquane AI", href: "/ai", icon: Sparkles, keywords: "chat assistant" },
];

const simpleProvider = <T extends { id: string; name: string; sub: string }>(
  id: string,
  label: string,
  kind: SearchResultKind,
  group: string,
  icon: SearchIcon,
  href: (row: T) => string,
  rows: T[],
): SearchProvider => ({
  id,
  label,
  search: (q) =>
    rows
      .filter((r) => !q || matches(q, `${r.name} ${r.sub} ${r.id}`))
      .map<SearchResult>((r) => ({
        key: `${kind}:${r.id}`,
        kind,
        label: r.name,
        sub: r.sub,
        href: href(r),
        icon,
        group,
        keywords: r.id,
      })),
});

const leadsProvider = simpleProvider(
  "leads", "Leads", "lead", "Leads", UserPlus, () => "/crm/leads", leads,
);
const projectsProvider = simpleProvider(
  "projects", "Projects", "project", "Projects", FolderKanban,
  (r) => `/projects/${r.id}`, projects,
);
const quotationsProvider = simpleProvider(
  "quotations", "Quotations", "quotation", "Quotations", FileText,
  (r) => `/quotations/${r.id}`, quotations,
);
const ordersProvider = simpleProvider(
  "orders", "Orders", "order", "Orders", Receipt, () => "/documents", orders,
);
const productsProvider = simpleProvider(
  "products", "Products", "product", "Products", Package,
  (r) => `/inventory/products/${r.id}`, products,
);
const containersProvider = simpleProvider(
  "containers", "Containers", "container", "Shipping", Container,
  () => "/shipping", containers,
);
const documentsProvider = simpleProvider(
  "documents", "Documents", "document", "Documents", Files,
  () => "/documents", documents,
);

const countriesProvider: SearchProvider = {
  id: "countries",
  label: "Countries",
  search: (q) =>
    countries
      .filter((c) => !q || matches(q, `${c.name} ${c.code}`))
      .map<SearchResult>((c) => ({
        key: `country:${c.code}`,
        kind: "country",
        label: `${c.flag} ${c.name}`,
        sub: `Filter customers & shipments in ${c.name}`,
        href: `/crm/customers?country=${c.code}`,
        icon: Globe2,
        group: "Countries",
        keywords: c.code,
      })),
};

const commandsProvider: SearchProvider = {
  id: "commands",
  label: "Quick commands",
  search: (q) =>
    commands
      .filter((c) => !q || matches(q, `${c.label} ${c.keywords ?? ""}`))
      .map<SearchResult>((c) => ({
        key: `command:${c.id}`,
        kind: "command",
        label: c.label,
        href: c.href,
        icon: c.icon,
        group: "Quick commands",
        keywords: c.keywords,
      })),
};

// Order defines the group order in the palette.
export const SEARCH_PROVIDERS: SearchProvider[] = [
  commandsProvider,
  customersProvider,
  leadsProvider,
  projectsProvider,
  quotationsProvider,
  ordersProvider,
  productsProvider,
  containersProvider,
  documentsProvider,
  countriesProvider,
];

/** Register a provider at runtime — safe to call from any module. */
export function registerSearchProvider(provider: SearchProvider) {
  if (SEARCH_PROVIDERS.find((p) => p.id === provider.id)) return;
  SEARCH_PROVIDERS.push(provider);
}

export function runSearch(query: string): SearchResult[] {
  const q = norm(query.trim());
  return SEARCH_PROVIDERS.flatMap((p) => p.search(q));
}

// Icon export so the palette can render pinned/recent groups.
export { Tag as SearchDefaultIcon };
