import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes, Building2, Download, Filter, Grid3x3, LayoutGrid,
  MapPin, Package, Plus, Rows3, Search, Sparkles, Table as TableIcon,
  TrendingUp, Warehouse as WarehouseIcon, X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ProductCard } from "@/components/inventory/ProductCard";
import { SlabVisual } from "@/components/inventory/SlabVisual";
import { StockLevelBadge } from "@/components/inventory/StatusBadge";
import {
  aggregateProduct, areaFmt, currency, productsWithStockOptions,
  warehousesOptions, type ProductWithStock,
} from "@/lib/inventory-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [
      { title: "Inventory Intelligence — Arquane OS" },
      { name: "description", content: "Live slab-level visibility across every warehouse: available, reserved, low stock, fast movers and new arrivals for the global stone and quartz portfolio." },
      { property: "og:title", content: "Inventory Intelligence — Arquane OS" },
      { property: "og:description", content: "Live slab-level visibility across every warehouse: available, reserved, low stock, fast movers and new arrivals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});

type ViewMode = "card" | "table" | "gallery" | "warehouse";

interface Filters {
  warehouse: string;    // warehouse code, or "all"
  thickness: string;    // "all" or "20" / "30"
  finish: string;
  collection: string;
  material: string;
  availability: string; // all | in-stock | low-stock | reserved | out-of-stock
  origin: string;
  priceGroup: string;
}

const DEFAULT_FILTERS: Filters = {
  warehouse: "all", thickness: "all", finish: "all", collection: "all",
  material: "all", availability: "all", origin: "all", priceGroup: "all",
};

function InventoryPage() {
  const products = useQuery(productsWithStockOptions());
  const warehouses = useQuery(warehousesOptions());

  const [view, setView] = useState<ViewMode>("card");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const all = products.data ?? [];
  const whs = warehouses.data ?? [];

  // Distinct values for filter chips
  const facets = useMemo(() => ({
    warehouses: whs.map((w) => w.code),
    thicknesses: uniq(all.map((p) => String(p.thickness_mm))).sort(),
    finishes: uniq(all.map((p) => p.finish)),
    collections: uniq(all.map((p) => p.collection?.name).filter(Boolean) as string[]),
    materials: uniq(all.map((p) => p.collection?.material).filter(Boolean) as string[]),
    origins: uniq(all.map((p) => p.collection?.origin_country).filter(Boolean) as string[]),
    priceGroups: uniq(all.map((p) => p.price_group)),
  }), [all, whs]);

  // Filter + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (filters.thickness   !== "all" && String(p.thickness_mm) !== filters.thickness) return false;
      if (filters.finish      !== "all" && p.finish !== filters.finish) return false;
      if (filters.collection  !== "all" && p.collection?.name !== filters.collection) return false;
      if (filters.material    !== "all" && p.collection?.material !== filters.material) return false;
      if (filters.origin      !== "all" && p.collection?.origin_country !== filters.origin) return false;
      if (filters.priceGroup  !== "all" && p.price_group !== filters.priceGroup) return false;
      if (filters.warehouse   !== "all" && !p.slabs?.some((s) => s.warehouse?.code === filters.warehouse)) return false;
      if (filters.availability !== "all") {
        const level = aggregateProduct(p).level;
        if (level !== filters.availability) return false;
      }
      if (q) {
        const hay = [
          p.name, p.sku, p.color_family, p.finish, p.collection?.name,
          p.collection?.material, p.collection?.origin_country,
          ...p.slabs?.map((s) => s.warehouse?.name ?? "") ?? [],
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, filters]);

  // Widgets
  const widgets = useMemo(() => computeWidgets(all), [all]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length + (query ? 1 : 0);

  return (
    <AppShell
      title="Inventory Intelligence"
      subtitle="Live slab-level visibility across every warehouse — available, reserved, fast movers and new arrivals."
      actions={
        <>
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Add slabs
          </Button>
        </>
      }
    >
      {/* Widgets */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Widget icon={Boxes}       label="Total slabs"  value={widgets.totalSlabs}  sub={areaFmt(widgets.totalAreaM2)} />
        <Widget icon={Package}     label="Available"    value={widgets.available}   sub="Ready to ship" tone="ok" />
        <Widget icon={Boxes}       label="Reserved"     value={widgets.reserved}    sub={`${widgets.reservedFor} customers`} tone="accent" />
        <Widget icon={TrendingUp}  label="Low stock"    value={widgets.lowStock}    sub="≤ 2 avail." tone="warn" />
        <Widget icon={TrendingUp}  label="Fast moving"  value={widgets.fastMoving}  sub="High reserved" tone="info" />
        <Widget icon={Boxes}       label="Dead stock"   value={widgets.deadStock}   sub=">120 days idle" tone="muted" />
        <Widget icon={Sparkles}    label="New arrivals" value={widgets.newArrivals} sub="Recently added" tone="accent" />
      </div>

      {/* AI strip */}
      <Card className="mt-6 border-accent/30 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 shadow-sm">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">AI inventory signals</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {widgets.lowStock > 0 && <>{widgets.lowStock} product{widgets.lowStock === 1 ? "" : "s"} are running low. </>}
              {widgets.newArrivals > 0 && <>Promote {widgets.newArrivals} new arrival{widgets.newArrivals === 1 ? "" : "s"} to top-tier accounts. </>}
              Fast movers in the last 30 days: <span className="font-medium text-foreground">{widgets.fastMoving}</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, collection, color, warehouse, finish…"
            className="pl-9"
          />
        </div>
        <ViewSwitcher view={view} onChange={setView} />
      </div>

      {/* Filter row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSelect label="Warehouse"  value={filters.warehouse}   onChange={(v) => setFilters({ ...filters, warehouse: v })}   options={facets.warehouses} />
        <FilterSelect label="Thickness"  value={filters.thickness}   onChange={(v) => setFilters({ ...filters, thickness: v })}   options={facets.thicknesses.map((t) => ({ value: t, label: `${t}mm` }))} />
        <FilterSelect label="Finish"     value={filters.finish}      onChange={(v) => setFilters({ ...filters, finish: v })}      options={facets.finishes} />
        <FilterSelect label="Collection" value={filters.collection}  onChange={(v) => setFilters({ ...filters, collection: v })}  options={facets.collections} />
        <FilterSelect label="Material"   value={filters.material}    onChange={(v) => setFilters({ ...filters, material: v })}    options={facets.materials} />
        <FilterSelect label="Origin"     value={filters.origin}      onChange={(v) => setFilters({ ...filters, origin: v })}      options={facets.origins} />
        <FilterSelect label="Price grp"  value={filters.priceGroup}  onChange={(v) => setFilters({ ...filters, priceGroup: v })}  options={facets.priceGroups} />
        <FilterSelect label="Status"     value={filters.availability} onChange={(v) => setFilters({ ...filters, availability: v })} options={[
          { value: "in-stock", label: "Available" },
          { value: "low-stock", label: "Low stock" },
          { value: "reserved", label: "Reserved" },
          { value: "out-of-stock", label: "Out of stock" },
        ]} />
        {activeFilterCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(""); }} className="text-muted-foreground">
            <X className="mr-1 h-3.5 w-3.5" /> Clear ({activeFilterCount})
          </Button>
        )}
        <div className="ml-auto text-[12px] text-muted-foreground">
          {products.isLoading ? "Loading…" : `${filtered.length} of ${all.length} products`}
        </div>
      </div>

      {/* Views */}
      <div className="mt-5">
        {products.isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">Failed to load inventory. {(products.error as Error).message}</CardContent>
          </Card>
        )}

        {products.isLoading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => { setFilters(DEFAULT_FILTERS); setQuery(""); }} />
        ) : view === "card" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : view === "gallery" ? (
          <GalleryView products={filtered} />
        ) : view === "warehouse" ? (
          <WarehouseView products={filtered} warehouses={whs} />
        ) : (
          <TableView products={filtered} />
        )}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
        Slab visuals are generated from each product's color-family gradient. Upload real slab photography to <code className="rounded bg-muted px-1">stone_products.image_url</code> to override.
      </div>
    </AppShell>
  );
}

// -------------------- Sub-components --------------------

function ViewSwitcher({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { id: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { id: "card",      label: "Cards",     icon: LayoutGrid },
    { id: "table",     label: "Table",     icon: Rows3 },
    { id: "gallery",   label: "Gallery",   icon: Grid3x3 },
    { id: "warehouse", label: "Warehouse", icon: WarehouseIcon },
  ];
  return (
    <div className="flex items-center rounded-md border border-border bg-card p-0.5">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
            view === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <o.icon className="h-3.5 w-3.5" /> {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  const norm = options.map((o) => typeof o === "string" ? { value: o, label: o } : o);
  const active = value !== "all";
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors",
      active ? "border-primary/40 bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground",
    )}>
      <span className="font-medium">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[12px] font-medium text-foreground focus:outline-none"
      >
        <option value="all">All</option>
        {norm.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Widget({ icon: Icon, label, value, sub, tone = "default" }: {
  icon: typeof Boxes; label: string; value: number; sub?: string;
  tone?: "default" | "ok" | "warn" | "info" | "accent" | "muted";
}) {
  const toneCls =
    tone === "ok"     ? "text-success" :
    tone === "warn"   ? "text-warning" :
    tone === "info"   ? "text-info" :
    tone === "accent" ? "text-accent-foreground" :
    tone === "muted"  ? "text-muted-foreground" :
                        "text-foreground";
  const bg =
    tone === "ok"     ? "bg-success/10" :
    tone === "warn"   ? "bg-warning/10" :
    tone === "info"   ? "bg-info/10" :
    tone === "accent" ? "bg-accent/10" :
                        "bg-muted";
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={cn("grid h-6 w-6 place-items-center rounded-md", bg, toneCls)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className={cn("mt-2 text-[22px] font-semibold tabular-nums tracking-tight", toneCls)}>{value}</div>
        {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function TableView({ products }: { products: ProductWithStock[] }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur">
            <TableRow className="hover:bg-muted/60">
              <TableHead className="w-[28%]">Product</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Thickness</TableHead>
              <TableHead>Finish</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Area</TableHead>
              <TableHead>Warehouses</TableHead>
              <TableHead className="text-right">List / m²</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const a = aggregateProduct(p);
              return (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link to="/inventory/products/$productId" params={{ productId: p.id }} className="flex items-center gap-2.5 group">
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded">
                        <SlabVisual gradient={p.hero_gradient} imageUrl={p.image_url} alt={p.name} ratio="landscape" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground group-hover:text-primary">{p.name.split(" — ")[0]}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{p.sku} · {p.color_family}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{p.collection?.name}</TableCell>
                  <TableCell className="text-[12px]">{p.thickness_mm}mm</TableCell>
                  <TableCell className="text-[12px]">{p.finish}</TableCell>
                  <TableCell className="text-[12px]">{p.collection?.origin_flag} {p.collection?.origin_country}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-success">{a.available}</TableCell>
                  <TableCell className="text-right tabular-nums text-accent-foreground">{a.reserved}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{areaFmt(a.totalAreaM2)}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{a.warehousesPresent.join(" · ") || "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{currency(Number(p.list_price_per_m2))}</TableCell>
                  <TableCell><StockLevelBadge level={a.level} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function GalleryView({ products }: { products: ProductWithStock[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {products.map((p) => {
        const a = aggregateProduct(p);
        return (
          <Link
            key={p.id}
            to="/inventory/products/$productId"
            params={{ productId: p.id }}
            className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <SlabVisual gradient={p.hero_gradient} imageUrl={p.image_url} alt={p.name} ratio="square" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-8">
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-semibold text-white">{p.name.split(" — ")[0]}</div>
                  <div className="truncate text-[10px] text-white/70">{p.thickness_mm}mm · {p.finish}</div>
                </div>
                <StockLevelBadge level={a.level} className="shrink-0" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function WarehouseView({ products, warehouses }: { products: ProductWithStock[]; warehouses: { id: string; code: string; name: string; city: string; country: string; country_flag: string }[] }) {
  // Regroup slabs by warehouse
  const byWarehouse = new Map<string, { warehouse: typeof warehouses[number]; rows: { product: ProductWithStock; count: number; areaM2: number; available: number; reserved: number }[] }>();
  warehouses.forEach((w) => byWarehouse.set(w.code, { warehouse: w, rows: [] }));

  products.forEach((p) => {
    const map = new Map<string, { count: number; areaM2: number; available: number; reserved: number }>();
    p.slabs?.forEach((s) => {
      const code = s.warehouse?.code;
      if (!code) return;
      const cur = map.get(code) ?? { count: 0, areaM2: 0, available: 0, reserved: 0 };
      cur.count += 1;
      cur.areaM2 += Number(s.area_m2 ?? 0);
      if (s.status === "available") cur.available += 1;
      if (s.status === "reserved") cur.reserved += 1;
      map.set(code, cur);
    });
    map.forEach((v, code) => {
      byWarehouse.get(code)?.rows.push({ product: p, ...v });
    });
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {Array.from(byWarehouse.values()).filter((g) => g.rows.length > 0).map((g) => (
        <Card key={g.warehouse.code} className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border/60 p-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                  <WarehouseIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {g.warehouse.country_flag} {g.warehouse.name}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{g.warehouse.code}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {g.warehouse.city}, {g.warehouse.country}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Slabs</div>
                <div className="text-[16px] font-semibold text-foreground tabular-nums">
                  {g.rows.reduce((s, r) => s + r.count, 0)}
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {g.rows.map((r) => (
                <Link
                  key={r.product.id}
                  to="/inventory/products/$productId"
                  params={{ productId: r.product.id }}
                  className="flex items-center gap-3 p-3 hover:bg-muted/40"
                >
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded">
                    <SlabVisual gradient={r.product.hero_gradient} imageUrl={r.product.image_url} alt={r.product.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-foreground">{r.product.name.split(" — ")[0]}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{r.product.thickness_mm}mm · {r.product.finish} · {areaFmt(r.areaM2)}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="text-right">
                      <div className="font-semibold tabular-nums text-success">{r.available}</div>
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Avail.</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums text-accent-foreground">{r.reserved}</div>
                      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Reserv.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[16/10] bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-8 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Filter className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">No products match your filters</div>
          <div className="text-[12px] text-muted-foreground">Try widening the criteria or clearing the search.</div>
        </div>
        <Button size="sm" variant="outline" onClick={onClear}>Clear all</Button>
      </CardContent>
    </Card>
  );
}

// -------------------- Helpers --------------------

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function computeWidgets(products: ProductWithStock[]) {
  let totalSlabs = 0, available = 0, reserved = 0, incoming = 0;
  let totalAreaM2 = 0;
  const reservedCustomers = new Set<string>();
  let lowStock = 0, deadStock = 0, fastMoving = 0, newArrivals = 0;
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  products.forEach((p) => {
    if (p.is_new_arrival) newArrivals += 1;
    const agg = aggregateProduct(p);
    totalSlabs += agg.total;
    available += agg.available;
    reserved += agg.reserved;
    incoming += agg.incoming;
    totalAreaM2 += agg.totalAreaM2;
    if (agg.level === "low-stock") lowStock += 1;
    if (agg.reserved >= 2) fastMoving += 1;
    // Dead stock: all slabs available AND oldest received > 120 days
    if (agg.total > 0 && agg.reserved === 0 && agg.available === agg.total) {
      const oldest = Math.min(...(p.slabs?.map((s) => new Date(s.received_at).getTime()) ?? [now]));
      if (now - oldest > 120 * DAY) deadStock += 1;
    }
    p.slabs?.forEach((s) => { if (s.reserved_for) reservedCustomers.add(s.reserved_for); });
  });

  return {
    totalSlabs, available, reserved, incoming, totalAreaM2,
    lowStock, deadStock, fastMoving, newArrivals,
    reservedFor: reservedCustomers.size,
  };
}
