import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, Calendar, Copy, Download, ExternalLink,
  FileText, MapPin, Package, Plus, Ruler, Send, Sparkles, X, ZoomIn,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SlabVisual } from "@/components/inventory/SlabVisual";
import { StockLevelBadge, SlabStatusBadge } from "@/components/inventory/StatusBadge";
import {
  aggregateProduct, areaFmt, currency, productDetailOptions,
} from "@/lib/inventory-queries";
import { cn } from "@/lib/utils";
import { useSetBusinessContext } from "@/context/BusinessContext";

export const Route = createFileRoute("/_authenticated/inventory/products/$productId")({
  head: () => ({
    meta: [
      { title: "Product — Arquane OS" },
      { name: "description", content: "Slab-level detail: technical specs, warehouse allocation, reservation history and pricing." },
      { property: "og:title", content: "Product detail — Arquane OS" },
      { property: "og:description", content: "Slab-level detail: technical specs, warehouse allocation, reservation history and pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <AppShell title="Something went wrong">
      <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Product not found">
      <p className="text-sm text-muted-foreground">
        This product may have been archived.{" "}
        <Link to="/inventory/products" className="text-primary hover:underline">Back to inventory</Link>.
      </p>
    </AppShell>
  ),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { data: p, isLoading, isError, error } = useQuery(productDetailOptions(productId));
  const [zoom, setZoom] = useState(false);

  useSetBusinessContext(
    p
      ? {
          kind: "inventory",
          id: p.id,
          label: p.name,
          sublabel: p.sku ?? undefined,
          href: `/inventory/products/${p.id}`,
        }
      : null,
  );


  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="aspect-[4/3] rounded-lg bg-muted lg:col-span-2" />
            <div className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </AppShell>
    );
  }
  if (isError) {
    return <AppShell title="Error"><p className="text-sm text-destructive">{(error as Error).message}</p></AppShell>;
  }
  if (!p) throw notFound();

  const agg = aggregateProduct(p);
  const slabs = [...(p.slabs ?? [])].sort((a, b) => a.slab_number.localeCompare(b.slab_number));
  const reservationHistory = slabs.filter((s) => s.reserved_for);
  const specs = (p.tech_specs ?? {}) as Record<string, string | number>;

  return (
    <AppShell>
      {/* Back */}
      <div className="mb-4">
        <Link to="/inventory/products" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Inventory
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StockLevelBadge level={agg.level} />
            <span className="text-[11px] font-medium text-muted-foreground">{p.sku}</span>
            {p.is_new_arrival && (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">New arrival</span>
            )}
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {p.collection?.name}</span>
            <span>·</span>
            <span>{p.collection?.material}</span>
            <span>·</span>
            <span>{p.collection?.origin_flag} {p.collection?.origin_country}</span>
            <span>·</span>
            <span>Price group {p.price_group}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm"><Copy className="mr-1.5 h-4 w-4" /> Duplicate</Button>
          <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-4 w-4" /> Open customer</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="mr-1.5 h-4 w-4" /> Generate quote
          </Button>
        </div>
      </div>

      {/* Metric strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Available"  value={String(agg.available)}     tone="ok" />
        <Metric label="Reserved"   value={String(agg.reserved)}      tone="accent" />
        <Metric label="Incoming"   value={String(agg.incoming)}      tone="info" />
        <Metric label="Total area" value={areaFmt(agg.totalAreaM2)} />
        <Metric label="List / m²"  value={currency(Number(p.list_price_per_m2))} accent />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: hero + tabs */}
        <div className="space-y-5 lg:col-span-2">
          {/* Hero visual */}
          <Card className="overflow-hidden">
            <div className="relative">
              <SlabVisual gradient={p.hero_gradient} imageUrl={p.image_url} alt={p.name} ratio="hero" />
              <button
                onClick={() => setZoom(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-background/85 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur hover:bg-background"
              >
                <ZoomIn className="h-3.5 w-3.5" /> Zoom
              </button>
            </div>
          </Card>

          {/* Tabs: bookmatch / applications / specs / history */}
          <Tabs defaultValue="specs">
            <TabsList>
              <TabsTrigger value="specs">Technical data</TabsTrigger>
              <TabsTrigger value="bookmatch">Book-match</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="inventory">Inventory history</TabsTrigger>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="pricing">Price history</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="specs" className="mt-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-[14px] font-semibold">Technical data</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                    <SpecRow k="Material" v={p.collection?.material ?? "—"} />
                    <SpecRow k="Collection" v={p.collection?.name ?? "—"} />
                    <SpecRow k="Color family" v={p.color_family} />
                    <SpecRow k="Thickness" v={`${p.thickness_mm} mm`} />
                    <SpecRow k="Finish" v={p.finish} />
                    <SpecRow k="Origin" v={`${p.collection?.origin_flag ?? ""} ${p.collection?.origin_country ?? "—"}`} />
                    {Object.entries(specs).map(([k, v]) => (
                      <SpecRow key={k} k={humanize(k)} v={String(v)} />
                    ))}
                  </dl>
                  {p.description && (
                    <p className="mt-4 border-t border-border pt-4 text-[13px] leading-relaxed text-muted-foreground">{p.description}</p>
                  )}
                  {p.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <span key={t} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80">{t}</span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookmatch" className="mt-4">
              <ImageGallery urls={p.bookmatch_urls} gradient={p.hero_gradient} title="Book-match pairs" hint="Upload paired slab photography to showcase mirrored veining." />
            </TabsContent>

            <TabsContent value="applications" className="mt-4">
              <ImageGallery urls={p.application_urls} gradient={p.hero_gradient} title="Applications" hint="Add photography of completed installations (kitchens, lobbies, cladding)." />
            </TabsContent>

            <TabsContent value="inventory" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead>Slab #</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Bin</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Area</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slabs.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-[12px] font-medium text-foreground">{s.slab_number}</TableCell>
                          <TableCell className="text-[12px]">{s.warehouse?.country_flag} {s.warehouse?.code}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{s.bin_location ?? "—"}</TableCell>
                          <TableCell className="text-[12px] tabular-nums">{s.length_cm} × {s.width_cm} cm</TableCell>
                          <TableCell className="text-right text-[12px] tabular-nums">{areaFmt(Number(s.area_m2 ?? 0))}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{s.received_at}</TableCell>
                          <TableCell><SlabStatusBadge status={s.status} /></TableCell>
                          <TableCell className="text-right">
                            {s.status === "available" ? (
                              <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                                <Plus className="mr-1 h-3 w-3" /> Reserve
                              </Button>
                            ) : s.status === "reserved" ? (
                              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground">
                                <X className="mr-1 h-3 w-3" /> Release
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations" className="mt-4">
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {reservationHistory.length === 0 ? (
                    <div className="p-8 text-center text-[13px] text-muted-foreground">No active reservations for this product.</div>
                  ) : reservationHistory.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-foreground">{r.reserved_for}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Slab {r.slab_number} · {r.warehouse?.code} · until {r.reserved_until ?? "—"}
                        </div>
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{areaFmt(Number(r.area_m2 ?? 0))}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]"><ExternalLink className="mr-1 h-3 w-3" /> Open</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <PriceHistory listPrice={Number(p.list_price_per_m2)} costPrice={Number(p.cost_price_per_m2 ?? 0)} />
            </TabsContent>

            <TabsContent value="docs" className="mt-4">
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {[
                    { name: "Technical datasheet.pdf", size: "1.2 MB" },
                    { name: "Certificate of Origin.pdf", size: "324 KB" },
                    { name: "Care & maintenance guide.pdf", size: "812 KB" },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center gap-3 p-3">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-foreground">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">{d.size}</div>
                      </div>
                      <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Warehouse distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[13px] font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Warehouse allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agg.warehousesPresent.length === 0 && (
                <div className="text-[12px] text-muted-foreground">Not currently stocked in any warehouse.</div>
              )}
              {Array.from(new Map(
                (p.slabs ?? []).filter((s) => s.warehouse).map((s) => [s.warehouse!.code, s.warehouse!])
              ).values()).map((w) => {
                const items = p.slabs?.filter((s) => s.warehouse?.code === w.code) ?? [];
                const av = items.filter((i) => i.status === "available").length;
                const rv = items.filter((i) => i.status === "reserved").length;
                return (
                  <div key={w.code} className="rounded-md border border-border/60 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-foreground">{w.country_flag} {w.name}</div>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{w.code}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px]">
                      <span className="text-success">● {av} avail.</span>
                      <span className="text-accent-foreground">● {rv} reserved</span>
                      <span className="ml-auto text-muted-foreground">{items.length} slabs</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI suggestions */}
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <CardTitle className="text-[13px] font-semibold">AI suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[12px]">
              {agg.level === "low-stock" && (
                <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                  Only {agg.available} slab{agg.available === 1 ? "" : "s"} available. Reorder {Math.max(6, agg.reserved + 4)} more from origin.
                </div>
              )}
              {agg.reserved >= 2 && (
                <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                  Fast-moving product — {agg.reserved} slabs reserved this cycle. Consider raising list price {currency(Number(p.list_price_per_m2) * 1.05)}.
                </div>
              )}
              {p.is_new_arrival && (
                <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                  New arrival — promote to Platinum accounts and add to the featured collection.
                </div>
              )}
              <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                Frequently paired with book-matched Statuario Extra 30mm for island tops.
              </div>
            </CardContent>
          </Card>

          {/* Pricing snapshot */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-[13px] font-semibold">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-[13px]">
              <PriceRow k="Cost / m²"  v={currency(Number(p.cost_price_per_m2 ?? 0))} muted />
              <PriceRow k="List / m²"  v={currency(Number(p.list_price_per_m2))} bold />
              <PriceRow k="Margin"     v={p.cost_price_per_m2 ? `${Math.round((1 - Number(p.cost_price_per_m2) / Number(p.list_price_per_m2)) * 100)}%` : "—"} tone="pos" />
              <PriceRow k="Price group" v={p.price_group} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zoom overlay */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-6 backdrop-blur"
          onClick={() => setZoom(false)}
        >
          <div className="relative w-full max-w-5xl">
            <SlabVisual gradient={p.hero_gradient} imageUrl={p.image_url} alt={p.name} ratio="hero" />
            <button
              onClick={() => setZoom(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
              aria-label="Close zoom"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// -------------------- Sub-components --------------------

function Metric({ label, value, tone, accent }: { label: string; value: string; tone?: "ok" | "accent" | "info"; accent?: boolean }) {
  const toneCls =
    tone === "ok"     ? "text-success" :
    tone === "accent" ? "text-accent-foreground" :
    tone === "info"   ? "text-info" :
    accent            ? "text-accent" :
                        "text-foreground";
  return (
    <div className={cn(
      "rounded-lg border p-3",
      accent ? "border-accent/30 bg-accent/5" : "border-border bg-card",
    )}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-[18px] font-semibold tracking-tight tabular-nums", toneCls)}>{value}</div>
    </div>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-1.5">
      <dt className="text-[12px] text-muted-foreground">{k}</dt>
      <dd className="text-[13px] font-medium text-foreground">{v}</dd>
    </div>
  );
}

function PriceRow({ k, v, muted, bold, tone }: { k: string; v: string; muted?: boolean; bold?: boolean; tone?: "pos" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted-foreground">{k}</span>
      <span className={cn(
        "tabular-nums",
        muted && "text-muted-foreground",
        bold && "font-semibold text-foreground",
        tone === "pos" && "text-success font-semibold",
        !muted && !bold && !tone && "text-foreground",
      )}>{v}</span>
    </div>
  );
}

function ImageGallery({ urls, gradient, title, hint }: { urls: string[]; gradient: string; title: string; hint: string }) {
  if (urls.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">No {title.toLowerCase()} yet</div>
            <div className="text-[12px] text-muted-foreground">{hint}</div>
          </div>
          <Button size="sm" variant="outline">Upload photography</Button>
          {/* Preview strip so the tab is not visually empty */}
          <div className="mt-2 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-24 overflow-hidden rounded opacity-70">
                <SlabVisual gradient={gradient} alt="preview" ratio="landscape" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {urls.map((u, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border">
          <img src={u} alt={`${title} ${i + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function PriceHistory({ listPrice, costPrice }: { listPrice: number; costPrice: number }) {
  // Synthetic 6-month history until pricing audit table lands
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const list = months.map((_, i) => Math.round(listPrice * (0.92 + i * 0.016)));
  const cost = months.map((_, i) => Math.round(costPrice * (0.94 + i * 0.012)));
  const max = Math.max(...list) * 1.05;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[14px] font-semibold">Price history (last 6 months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-40 items-end gap-2">
          {list.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end gap-0.5">
                <div className="flex-1 rounded-t bg-primary/70" style={{ height: `${(v / max) * 100}%` }} title={`List ${v}`} />
                <div className="flex-1 rounded-t bg-muted-foreground/40" style={{ height: `${(cost[i] / max) * 100}%` }} title={`Cost ${cost[i]}`} />
              </div>
              <div className="text-[10px] text-muted-foreground">{months[i]}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 text-[11px]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-primary/70" /> List price / m²</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-muted-foreground/40" /> Cost / m²</span>
          <span className="ml-auto flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" /> Synthetic — connect audit log for live history</span>
        </div>
      </CardContent>
    </Card>
  );
}

function humanize(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
