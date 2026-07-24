import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Download,
  Filter,
  Grid3x3,
  List,
  Package,
  Plus,
  Search,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [
      { title: "Inventory — Arquane OS" },
      { name: "description", content: "Slab-level natural stone and quartz inventory across global warehouses with reservation and reorder intelligence." },
      { property: "og:title", content: "Inventory — Arquane OS" },
      { property: "og:description", content: "Slab-level natural stone and quartz inventory across global warehouses with reservation and reorder intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});

type Status = "Available" | "Reserved" | "Low stock" | "Incoming";
type Material = "Marble" | "Quartzite" | "Granite" | "Onyx" | "Quartz";

interface Slab {
  id: string;
  name: string;
  material: Material;
  finish: string;
  thickness: string;
  size: string;
  warehouse: string;
  origin: string;
  quantity: number;
  reserved: number;
  pricePerSqm: number;
  status: Status;
  gradient: string;
}

const SLABS: Slab[] = [
  { id: "SL-8821", name: "Calacatta Viola", material: "Marble", finish: "Polished", thickness: "2cm", size: "320×160cm", warehouse: "Livorno, IT", origin: "Carrara, Italy", quantity: 42, reserved: 12, pricePerSqm: 480, status: "Available", gradient: "from-[#f4ebe0] via-[#e8d4c1] to-[#b8877a]" },
  { id: "SL-8817", name: "Statuario Extra", material: "Marble", finish: "Honed", thickness: "3cm", size: "310×155cm", warehouse: "Livorno, IT", origin: "Carrara, Italy", quantity: 8, reserved: 6, pricePerSqm: 620, status: "Low stock", gradient: "from-[#faf8f4] via-[#e8e4dc] to-[#a8a49c]" },
  { id: "SL-8815", name: "Taj Mahal Quartzite", material: "Quartzite", finish: "Leathered", thickness: "3cm", size: "330×170cm", warehouse: "Newark, US", origin: "Bahia, Brazil", quantity: 24, reserved: 4, pricePerSqm: 385, status: "Available", gradient: "from-[#f0e8d4] via-[#d4c4a0] to-[#8a7654]" },
  { id: "SL-8812", name: "Absolute Black", material: "Granite", finish: "Polished", thickness: "2cm", size: "300×160cm", warehouse: "Chennai, IN", origin: "Karnataka, India", quantity: 68, reserved: 8, pricePerSqm: 180, status: "Available", gradient: "from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a]" },
  { id: "SL-8809", name: "Onyx Miele", material: "Onyx", finish: "Polished", thickness: "2cm", size: "280×140cm", warehouse: "Livorno, IT", origin: "Iran", quantity: 6, reserved: 2, pricePerSqm: 920, status: "Low stock", gradient: "from-[#f5d896] via-[#d4a04c] to-[#7a5020]" },
  { id: "SL-8805", name: "Verde Guatemala", material: "Marble", finish: "Polished", thickness: "2cm", size: "290×145cm", warehouse: "Cape Town, ZA", origin: "India", quantity: 14, reserved: 0, pricePerSqm: 340, status: "Available", gradient: "from-[#3a5a3a] via-[#284228] to-[#152815]" },
  { id: "SL-8801", name: "Nero Marquina", material: "Marble", finish: "Honed", thickness: "3cm", size: "310×160cm", warehouse: "Newark, US", origin: "Basque, Spain", quantity: 0, reserved: 0, pricePerSqm: 410, status: "Incoming", gradient: "from-[#1a1a1a] via-[#2a2a2a] to-[#4a4a4a]" },
  { id: "SL-8798", name: "Bianco Quartz", material: "Quartz", finish: "Polished", thickness: "2cm", size: "320×165cm", warehouse: "Newark, US", origin: "Engineered", quantity: 96, reserved: 24, pricePerSqm: 220, status: "Available", gradient: "from-[#fafafa] via-[#ececec] to-[#c8c8c8]" },
  { id: "SL-8795", name: "Travertino Romano", material: "Marble", finish: "Filled & polished", thickness: "2cm", size: "300×150cm", warehouse: "Livorno, IT", origin: "Tivoli, Italy", quantity: 18, reserved: 5, pricePerSqm: 265, status: "Reserved", gradient: "from-[#e8d8c0] via-[#c8a878] to-[#8a6a40]" },
  { id: "SL-8791", name: "Patagonia Quartzite", material: "Quartzite", finish: "Polished", thickness: "3cm", size: "330×170cm", warehouse: "Chennai, IN", origin: "Rio Grande, Brazil", quantity: 4, reserved: 4, pricePerSqm: 780, status: "Reserved", gradient: "from-[#e8ecf0] via-[#a8b4c8] to-[#4a5a78]" },
  { id: "SL-8788", name: "Emperador Dark", material: "Marble", finish: "Polished", thickness: "2cm", size: "300×155cm", warehouse: "Livorno, IT", origin: "Spain", quantity: 28, reserved: 3, pricePerSqm: 295, status: "Available", gradient: "from-[#5a3820] via-[#3a2410] to-[#1a1008]" },
  { id: "SL-8784", name: "Fusion Quartzite", material: "Quartzite", finish: "Leathered", thickness: "3cm", size: "320×160cm", warehouse: "Newark, US", origin: "Brazil", quantity: 9, reserved: 1, pricePerSqm: 540, status: "Low stock", gradient: "from-[#d8a878] via-[#8a4a2a] to-[#3a1810]" },
];

const STATUS_STYLES: Record<Status, string> = {
  Available: "bg-success/10 text-success border-success/20",
  Reserved: "bg-info/10 text-info border-info/20",
  "Low stock": "bg-warning/10 text-warning border-warning/20",
  Incoming: "bg-muted text-muted-foreground border-border",
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const MATERIALS: (Material | "All")[] = ["All", "Marble", "Quartzite", "Granite", "Onyx", "Quartz"];

function SlabCard({ slab }: { slab: Slab }) {
  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition hover:shadow-md">
      <div className={cn("relative h-40 w-full bg-gradient-to-br", slab.gradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.15),transparent_50%)]" />
        <div className="absolute left-3 top-3">
          <Badge variant="outline" className={cn("border font-medium backdrop-blur-sm bg-card/70", STATUS_STYLES[slab.status])}>
            {slab.status}
          </Badge>
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-card/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {slab.thickness}
        </div>
      </div>
      <CardContent className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{slab.name}</div>
            <div className="truncate text-xs text-muted-foreground">{slab.material} · {slab.finish}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-foreground">{currency(slab.pricePerSqm)}</div>
            <div className="text-[10px] text-muted-foreground">per m²</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Warehouse className="h-3 w-3" /> {slab.warehouse}</span>
          <span>{slab.size}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{slab.quantity - slab.reserved}</span> / {slab.quantity} avail.
          </span>
          <span className="text-muted-foreground">{slab.id}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState<Material | "All">("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SLABS.filter((s) => {
      if (material !== "All" && s.material !== material) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) || s.warehouse.toLowerCase().includes(q);
    });
  }, [query, material]);

  const totalSlabs = SLABS.reduce((s, x) => s + x.quantity, 0);
  const totalValue = SLABS.reduce((s, x) => s + x.quantity * x.pricePerSqm * 4.8, 0);
  const lowStock = SLABS.filter((s) => s.status === "Low stock").length;

  const kpis = [
    { label: "SKUs in catalog", value: SLABS.length, hint: "12 origins" },
    { label: "Total slabs", value: totalSlabs.toLocaleString(), hint: "4 warehouses" },
    { label: "Inventory value", value: currency(totalValue), hint: "+6.1% MoM" },
    { label: "Low-stock alerts", value: lowStock, hint: "Reorder recommended" },
  ];

  return (
    <AppShell
      title="Inventory"
      subtitle="Slab-level stock across global warehouses with reservation and reorder intelligence."
      actions={
        <>
          <Button size="sm" variant="outline"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Add inventory
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-warning/30 bg-warning/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/15 text-warning">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">3 SKUs below threshold</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Statuario Extra, Onyx Miele, and Fusion Quartzite need reorder within 14 days.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/30 bg-info/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-info/15 text-info">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">2 containers in transit</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Nero Marquina ETA Newark 12 days · Calacatta Gold ETA Livorno 4 days.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">AI reorder plan ready</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Suggested PO: 18 slabs across 4 SKUs, est. $84,200 landed cost.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search slabs, origin, warehouse…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
            {MATERIALS.map((m) => (
              <button
                key={m}
                onClick={() => setMaterial(m)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition",
                  material === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm"><Filter className="mr-1.5 h-3.5 w-3.5" /> Filters</Button>
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="grid"><Grid3x3 className="h-3.5 w-3.5" /></TabsTrigger>
              <TabsTrigger value="list"><List className="h-3.5 w-3.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tabs value={view} className="mt-4">
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s) => <SlabCard key={s.id} slab={s} />)}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                <Package className="mx-auto mb-2 h-5 w-5 opacity-50" /> No slabs match your filters.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <Card className="border-border/60 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[26%]">Slab</TableHead>
                  <TableHead>Material · Finish</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Size · Thickness</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Price / m²</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-9 w-9 shrink-0 rounded-md bg-gradient-to-br", s.gradient)} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{s.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{s.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.material} · {s.finish}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.origin}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.warehouse}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.size} · {s.thickness}</TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">
                      {s.quantity - s.reserved}<span className="text-muted-foreground"> / {s.quantity}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">{currency(s.pricePerSqm)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border font-medium", STATUS_STYLES[s.status])}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
