import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Loc = { id: string; name: string; sub: string };
const HQ: Loc = { id: "hq-us", name: "Arquane Surfaces", sub: "HQ · United States" };
const KEY = "arquane.location";

export function LocationSwitcher() {
  const [activeId, setActiveId] = useState<string>(HQ.id);
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v) setActiveId(v);
  }, []);

  const { data: warehouses = [] } = useQuery({
    queryKey: ["locations", "warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stone_warehouses")
        .select("id,name,city,country,code")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const locations: Loc[] = [
    HQ,
    ...warehouses.map((w) => ({ id: w.id, name: w.name, sub: `${w.city} · ${w.country}` })),
  ];
  const active = locations.find((l) => l.id === activeId) ?? HQ;

  const select = (id: string) => {
    setActiveId(id);
    localStorage.setItem(KEY, id);
    window.dispatchEvent(new CustomEvent("arquane:location", { detail: id }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mx-3 mt-1 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-sidebar-primary/20 text-sidebar-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-white">{active.name}</div>
            <div className="truncate text-[10px] text-sidebar-foreground/60">{active.sub}</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[232px]">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Switch location
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locations.map((l) => (
          <DropdownMenuItem key={l.id} onClick={() => select(l.id)} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{l.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{l.sub}</div>
            </div>
            {l.id === active.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
