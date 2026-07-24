// Inventory Intelligence data layer.
// All queries hit Supabase via the browser client; public SELECT policies allow
// unauthenticated reads. TanStack Query owns caching and background refetch.

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---------- Row types ----------
export type Warehouse   = Database["public"]["Tables"]["stone_warehouses"]["Row"];
export type Collection  = Database["public"]["Tables"]["stone_collections"]["Row"];
export type ProductRow  = Database["public"]["Tables"]["stone_products"]["Row"];
export type SlabRow     = Database["public"]["Tables"]["stone_slabs"]["Row"];
export type SlabStatus  = Database["public"]["Enums"]["slab_status"];

export type SlabWithWarehouse = SlabRow & { warehouse: Warehouse | null };
export type ProductWithStock = ProductRow & {
  collection: Collection | null;
  slabs: SlabWithWarehouse[];
};

// ---------- Derived aggregates ----------
export type StockLevel = "in-stock" | "low-stock" | "reserved" | "out-of-stock";

export interface ProductAggregate {
  total: number;
  available: number;
  reserved: number;
  incoming: number;
  totalAreaM2: number;
  warehousesPresent: string[];
  level: StockLevel;
}

export function aggregateProduct(p: ProductWithStock): ProductAggregate {
  const slabs = p.slabs ?? [];
  const available = slabs.filter((s) => s.status === "available").length;
  const reserved  = slabs.filter((s) => s.status === "reserved").length;
  const incoming  = slabs.filter((s) => s.status === "incoming").length;
  const totalAreaM2 = slabs.reduce((sum, s) => sum + Number(s.area_m2 ?? 0), 0);
  const warehousesPresent = Array.from(
    new Set(slabs.map((s) => s.warehouse?.code).filter((v): v is string => Boolean(v))),
  );

  let level: StockLevel = "in-stock";
  if (available === 0 && reserved === 0 && incoming === 0) level = "out-of-stock";
  else if (available === 0 && reserved > 0) level = "reserved";
  else if (available > 0 && available <= 2) level = "low-stock";
  return { total: slabs.length, available, reserved, incoming, totalAreaM2, warehousesPresent, level };
}

// ---------- Queries ----------
export const productsWithStockOptions = () =>
  queryOptions({
    queryKey: ["inventory", "products-with-stock"],
    staleTime: 30_000,
    queryFn: async (): Promise<ProductWithStock[]> => {
      const { data, error } = await supabase
        .from("stone_products")
        .select(`
          *,
          collection:stone_collections(*),
          slabs:stone_slabs(*, warehouse:stone_warehouses(*))
        `)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ProductWithStock[];
    },
  });

export const warehousesOptions = () =>
  queryOptions({
    queryKey: ["inventory", "warehouses"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Warehouse[]> => {
      const { data, error } = await supabase
        .from("stone_warehouses")
        .select("*")
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

export const productDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ["inventory", "product", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ProductWithStock | null> => {
      const { data, error } = await supabase
        .from("stone_products")
        .select(`
          *,
          collection:stone_collections(*),
          slabs:stone_slabs(*, warehouse:stone_warehouses(*))
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ProductWithStock | null) ?? null;
    },
  });

// ---------- Formatting helpers ----------
export const currency = (n: number, ccy = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);

export const areaFmt = (n: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n)} m²`;

// ---------- Level → tone mapping (semantic tokens only) ----------
export const LEVEL_TONE: Record<StockLevel, { label: string; className: string; dot: string }> = {
  "in-stock":    { label: "Available",    className: "bg-success/10 text-success border-success/25",           dot: "bg-success" },
  "low-stock":   { label: "Low stock",    className: "bg-warning/10 text-warning border-warning/25",           dot: "bg-warning" },
  reserved:      { label: "Reserved",     className: "bg-accent/15 text-accent-foreground border-accent/30",   dot: "bg-accent" },
  "out-of-stock":{ label: "Out of stock", className: "bg-destructive/10 text-destructive border-destructive/25", dot: "bg-destructive" },
};

export const SLAB_STATUS_TONE: Record<SlabStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success/10 text-success border-success/25" },
  reserved:  { label: "Reserved",  className: "bg-accent/15 text-accent-foreground border-accent/30" },
  sold:      { label: "Sold",      className: "bg-muted text-muted-foreground border-border" },
  damaged:   { label: "Damaged",   className: "bg-destructive/10 text-destructive border-destructive/25" },
  incoming:  { label: "Incoming",  className: "bg-info/10 text-info border-info/25" },
};
