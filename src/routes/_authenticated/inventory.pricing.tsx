import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  DollarSign,
  Download,
  Percent,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Arquane OS" },
      { name: "description", content: "Dynamic pricing intelligence for global stone SKUs — landed cost, margin, and market benchmarks." },
      { property: "og:title", content: "Pricing — Arquane OS" },
      { property: "og:description", content: "Dynamic pricing intelligence for global stone SKUs — landed cost, margin, and market benchmarks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Trend = "up" | "down" | "flat";

interface PriceRow {
  id: string;
  sku: string;
  name: string;
  material: string;
  cost: number;
  landed: number;
  list: number;
  floor: number;
  market: number;
  margin: number;
  trend: Trend;
  currency: string;
  updated: string;
}

const ROWS: PriceRow[] = [
  { id: "P-8821", sku: "SL-8821", name: "Calacatta Viola", material: "Marble", cost: 260, landed: 305, list: 480, floor: 395, market: 495, margin: 36.5, trend: "up", currency: "USD", updated: "2h ago" },
  { id: "P-8817", sku: "SL-8817", name: "Statuario Extra", material: "Marble", cost: 340, landed: 395, list: 620, floor: 510, market: 640, margin: 36.3, trend: "up", currency: "USD", updated: "5h ago" },
  { id: "P-8815", sku: "SL-8815", name: "Taj Mahal Quartzite", material: "Quartzite", cost: 210, landed: 248, list: 385, floor: 320, market: 380, margin: 35.6, trend: "flat", currency: "USD", updated: "Yesterday" },
  { id: "P-8812", sku: "SL-8812", name: "Absolute Black", material: "Granite", cost: 92, landed: 118, list: 180, floor: 148, market: 172, margin: 34.4, trend: "down", currency: "USD", updated: "3d ago" },
  { id: "P-8809", sku: "SL-8809", name: "Onyx Miele", material: "Onyx", cost: 480, landed: 560, list: 920, floor: 760, market: 950, margin: 39.1, trend: "up", currency: "USD", updated: "1h ago" },
  { id: "P-8805", sku: "SL-8805", name: "Verde Guatemala", material: "Marble", cost: 175, landed: 210, list: 340, floor: 275, market: 335, margin: 38.2, trend: "flat", currency: "USD", updated: "2d ago" },
  { id: "P-8798", sku: "SL-8798", name: "Bianco Quartz", material: "Quartz", cost: 118, landed: 142, list: 220, floor: 185, market: 215, margin: 35.4, trend: "flat", currency: "USD", updated: "6h ago" },
  { id: "P-8795", sku: "SL-8795", name: "Travertino Romano", material: "Marble", cost: 138, landed: 165, list: 265, floor: 218, market: 258, margin: 37.7, trend: "down", currency: "USD", updated: "1d ago" },
  { id: "P-8791", sku: "SL-8791", name: "Patagonia Quartzite", material: "Quartzite", cost: 410, landed: 480, list: 780, floor: 640, market: 795, margin: 38.5, trend: "up", currency: "USD", updated: "4h ago" },
  { id: "P-8788", sku: "SL-8788", name: "Emperador Dark", material: "Marble", cost: 155, landed: 185, list: 295, floor: 245, market: 288, margin: 37.3, trend: "flat", currency: "USD", updated: "8h ago" },
];

const currency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

function TrendPill({ trend }: { trend: Trend }) {
  if (trend === "flat") return <span className="text-xs text-muted-foreground">—</span>;
  const up = trend === "up";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", up ? "text-success" : "text-destructive")}>
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {up ? "Trending up" : "Trending down"}
    </span>
  );
}

function MarginBar({ margin }: { margin: number }) {
  const width = Math.min(100, (margin / 45) * 100);
  const tone = margin >= 37 ? "from-success to-success" : margin >= 34 ? "from-accent to-accent" : "from-warning to-warning";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full bg-gradient-to-r", tone)} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-foreground">{margin.toFixed(1)}%</span>
    </div>
  );
}

function PricingPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return ROWS;
    return ROWS.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.material.toLowerCase().includes(q));
  }, [query]);

  const avgMargin = ROWS.reduce((s, r) => s + r.margin, 0) / ROWS.length;
  const belowMarket = ROWS.filter((r) => r.list < r.market).length;

  const kpis = [
    { label: "Avg. gross margin", value: `${avgMargin.toFixed(1)}%`, hint: "Target 36%", icon: Percent },
    { label: "Below market price", value: belowMarket, hint: "Reprice suggested", icon: TrendingUp },
    { label: "Priced SKUs", value: ROWS.length, hint: "USD base currency", icon: DollarSign },
    { label: "Rules active", value: 12, hint: "Auto-apply on quote", icon: Calculator },
  ];

  return (
    <AppShell
      title="Pricing"
      subtitle="Dynamic pricing intelligence — landed cost, margin bands, and market benchmarks."
      actions={
        <>
          <Button size="sm" variant="outline"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New rule
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <k.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-accent/30 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 shadow-sm">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">AI pricing signal</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Calacatta Viola market avg. rose 3.1% this month. Repricing 42 slabs to $495/m² would add est. $9,400 margin without demand risk.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent/10">
            Apply repricing
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Price book</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU…" className="pl-9 h-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Landed</TableHead>
                  <TableHead className="text-right">List</TableHead>
                  <TableHead className="text-right">Floor</TableHead>
                  <TableHead className="text-right">Market</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer">
                    <TableCell>
                      <div className="text-sm font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.sku} · {r.material}</div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{currency(r.cost)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{currency(r.landed)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">{currency(r.list)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{currency(r.floor)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      <span className={cn("font-medium", r.market > r.list ? "text-success" : r.market < r.list ? "text-destructive" : "text-muted-foreground")}>
                        {currency(r.market)}
                      </span>
                    </TableCell>
                    <TableCell><MarginBar margin={r.margin} /></TableCell>
                    <TableCell><TrendPill trend={r.trend} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Active pricing rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pb-5">
            {[
              { name: "Platinum tier discount", detail: "−8% off list, min margin 28%", badge: "Auto" },
              { name: "Container FOB pricing", detail: "≥20 slabs · −12% list", badge: "Auto" },
              { name: "MENA market uplift", detail: "+4% on marble family", badge: "Region" },
              { name: "Onyx premium band", detail: "Floor +15% above landed", badge: "Category" },
              { name: "USD/EUR hedge margin", detail: "+2.5% until FX <1.08", badge: "FX" },
              { name: "End-of-quarter push", detail: "−5% on aged >180 days", badge: "Time" },
            ].map((r) => (
              <div key={r.name} className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.detail}</div>
                </div>
                <Badge variant="outline" className="border-border text-[10px] font-medium text-muted-foreground">{r.badge}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
