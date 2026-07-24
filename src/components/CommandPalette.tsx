import { useEffect, useMemo, useState } from "react";
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
  Pin,
  PinOff,
  Clock,
  Star,
} from "lucide-react";
import type { SearchIcon, SearchResult } from "@/lib/search-providers";
import { SEARCH_PROVIDERS, runSearch } from "@/lib/search-providers";
import { useSearchHistory, type StoredResult } from "@/hooks/use-search-history";

type Nav = { label: string; to: string; icon: SearchIcon; group: string };

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

// Rehydrate a stored (icon-less) result via provider lookup so pins/recents
// render with the correct icon after reload.
function hydrate(stored: StoredResult): SearchResult {
  for (const p of SEARCH_PROVIDERS) {
    const hit = p.search("").find((r) => r.key === stored.key);
    if (hit) return hit;
  }
  return { ...stored, icon: Star };
}

const groupResults = (results: SearchResult[]) =>
  results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ||= []).push(r);
    return acc;
  }, {});

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { recent, pinned, recordUse, togglePin, isPinned } = useSearchHistory();

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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => runSearch(query), [query]);
  const grouped = useMemo(() => groupResults(results), [results]);
  const hydratedPinned = useMemo(() => pinned.map(hydrate), [pinned]);
  const hydratedRecent = useMemo(
    () => recent.map(hydrate).filter((r) => !isPinned(r.key)),
    [recent, isPinned],
  );

  const go = (r: SearchResult) => {
    recordUse(r);
    setOpen(false);
    navigate({ to: r.href });
  };

  const goNav = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  const showHistory = query.trim().length === 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search customers, quotations, products, containers, countries…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {showHistory && hydratedPinned.length > 0 && (
          <>
            <CommandGroup heading="Pinned">
              {hydratedPinned.map((r) => (
                <ResultItem
                  key={`pin-${r.key}`}
                  result={r}
                  pinned
                  onSelect={() => go(r)}
                  onTogglePin={() => togglePin(r)}
                />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {showHistory && hydratedRecent.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {hydratedRecent.map((r) => (
                <ResultItem
                  key={`recent-${r.key}`}
                  result={r}
                  recent
                  pinned={isPinned(r.key)}
                  onSelect={() => go(r)}
                  onTogglePin={() => togglePin(r)}
                />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {Object.entries(grouped).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((r) => (
              <ResultItem
                key={r.key}
                result={r}
                pinned={isPinned(r.key)}
                onSelect={() => go(r)}
                onTogglePin={() => togglePin(r)}
              />
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {navItems.map((it) => (
            <CommandItem key={it.to} value={`nav ${it.label}`} onSelect={() => goNav(it.to)}>
              <it.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {it.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

interface ResultItemProps {
  result: SearchResult;
  pinned?: boolean;
  recent?: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}

function ResultItem({ result, pinned, recent, onSelect, onTogglePin }: ResultItemProps) {
  const Icon = result.icon;
  return (
    <CommandItem
      value={`${result.label} ${result.sub ?? ""} ${result.keywords ?? ""} ${result.key}`}
      onSelect={onSelect}
      className="group"
    >
      <Icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium">{result.label}</span>
        {result.sub && (
          <span className="truncate text-[11px] text-muted-foreground">{result.sub}</span>
        )}
      </div>
      {recent && !pinned && (
        <Clock className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      )}
      <button
        type="button"
        aria-label={pinned ? "Unpin" : "Pin"}
        className="ml-2 rounded p-1 text-muted-foreground/70 opacity-0 transition hover:bg-surface-muted hover:text-foreground group-hover:opacity-100 data-[pinned=true]:opacity-100"
        data-pinned={pinned || undefined}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
      </button>
    </CommandItem>
  );
}

export function openCommandPalette() {
  (window as unknown as { __openCommandPalette?: () => void }).__openCommandPalette?.();
}
