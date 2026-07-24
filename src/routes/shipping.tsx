import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Ship, Plane, Truck, Plus, Search, ArrowRight, MapPin, Calendar,
  AlertTriangle, CheckCircle2, Container, PackageCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  shipmentsListOptions, STATUS_LABEL, STATUS_TONE, MODE_LABEL,
  transitProgress, fmtDate, currency, type ShipmentStatus,
} from "@/lib/shipping-queries";
import { createShipment } from "@/lib/shipping.functions";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Logistics — Arquane OS" },
      { name: "description", content: "Container tracking, freight cost and customs across your stone shipments." },
      { property: "og:title", content: "Shipping & Logistics — Arquane OS" },
      { property: "og:description", content: "Live container tracking, ETAs, and freight visibility across sea, air and road." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(shipmentsListOptions()),
  errorComponent: ({ error }) => (
    <AppShell title="Shipping"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Shipping"><div>Not found.</div></AppShell>,
  component: ShippingPage,
});

const STATUS_FILTERS: { key: "all" | ShipmentStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "planned", label: "Planned" },
  { key: "booked", label: "Booked" },
  { key: "in_transit", label: "In transit" },
  { key: "arrived", label: "Arrived" },
  { key: "delivered", label: "Delivered" },
];

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  sea: Ship, air: Plane, road: Truck, rail: Truck,
};

function ShippingPage() {
  const { data: rows } = useSuspenseQuery(shipmentsListOptions());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ShipmentStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.reference, r.carrier, r.container_number, r.origin_port, r.destination_port, r.bill_of_lading]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  const kpis = useMemo(() => {
    const inTransit = rows.filter((r) => r.status === "in_transit").length;
    const arriving = rows.filter((r) => {
      if (r.status !== "in_transit" && r.status !== "booked") return false;
      if (!r.eta) return false;
      const days = (new Date(r.eta).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 7;
    }).length;
    const delayed = rows.filter((r) => {
      if (r.status === "delivered" || r.status === "cancelled") return false;
      if (!r.eta) return false;
      return new Date(r.eta) < new Date();
    }).length;
    const freight = rows.reduce((s, r) => s + Number(r.freight_cost ?? 0), 0);
    return { total: rows.length, inTransit, arriving, delayed, freight };
  }, [rows]);

  return (
    <AppShell title="Shipping & Logistics" subtitle="Container tracking, ETAs, freight and customs.">
      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="In transit" value={String(kpis.inTransit)} sub={`${kpis.total} shipments total`} icon={Container} />
        <Kpi label="Arriving in 7 days" value={String(kpis.arriving)} icon={PackageCheck} tone={kpis.arriving > 0 ? "success" : undefined} />
        <Kpi label="Delayed" value={String(kpis.delayed)} icon={AlertTriangle} tone={kpis.delayed > 0 ? "warning" : undefined} />
        <Kpi label="Freight spend YTD" value={currency(kpis.freight)} icon={Ship} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search reference, container, carrier, port…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                status === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <NewShipmentDialog />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No shipments match your filters.
          </div>
        )}
        {filtered.map((s) => {
          const ModeIcon = MODE_ICON[s.mode] ?? Ship;
          const progress = transitProgress(s);
          const overdue =
            s.eta && new Date(s.eta) < new Date() && !["delivered", "cancelled", "arrived"].includes(s.status);
          const items = (s as typeof s & { items?: { id: string; description: string; quantity: number; unit: string }[] }).items ?? [];
          return (
            <Link
              key={s.id}
              to="/shipping/$shipmentId"
              params={{ shipmentId: s.id }}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <ModeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{s.reference}</span>
                      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATUS_TONE[s.status])}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {s.carrier ?? "—"} · {MODE_LABEL[s.mode] ?? s.mode}{s.container_number ? ` · ${s.container_number}` : ""}{s.container_type ? ` (${s.container_type})` : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">ETA</div>
                  <div className={cn("text-sm font-semibold tabular-nums", overdue && "text-destructive")}>{fmtDate(s.eta)}</div>
                </div>
              </div>

              {/* Route line */}
              <div className="mt-4 flex items-center gap-3">
                <RoutePoint label={s.origin_port ?? "Origin"} sub={s.origin_country ?? ""} />
                <div className="flex-1">
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                    <span>ETD {fmtDate(s.etd)}</span>
                    <span>{progress}%</span>
                    <span>ETA {fmtDate(s.eta)}</span>
                  </div>
                </div>
                <RoutePoint label={s.destination_port ?? "Destination"} sub={s.destination_country ?? ""} align="right" />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {items.length > 0
                    ? `${items.length} line${items.length > 1 ? "s" : ""} · ${items[0].description}${items.length > 1 ? " +" + (items.length - 1) : ""}`
                    : "No line items yet"}
                </span>
                <span className="flex items-center gap-3">
                  {s.weight_kg && <span>{Number(s.weight_kg).toLocaleString()} kg</span>}
                  {s.volume_m3 && <span>{Number(s.volume_m3).toLocaleString()} m³</span>}
                  {s.freight_cost && <span>{currency(Number(s.freight_cost), s.currency ?? "USD")}</span>}
                  <span className="inline-flex items-center text-primary">Open <ArrowRight className="ml-1 h-3.5 w-3.5" /></span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}

function Kpi({
  label, value, sub, icon: Icon, tone,
}: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; tone?: "warning" | "success" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("h-4 w-4", tone === "warning" && "text-warning", tone === "success" && "text-success", !tone && "text-muted-foreground")} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function RoutePoint({ label, sub, align = "left" }: { label: string; sub?: string; align?: "left" | "right" }) {
  return (
    <div className={cn("flex flex-col", align === "right" && "items-end text-right")}>
      <div className="flex items-center gap-1 text-xs font-medium text-foreground">
        <MapPin className="h-3 w-3 text-muted-foreground" /> {label}
      </div>
      {sub && <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{sub}</div>}
    </div>
  );
}

function NewShipmentDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    carrier: "", mode: "sea", container_number: "", container_type: "40HC", incoterm: "FOB",
    origin_port: "", origin_country: "", destination_port: "", destination_country: "",
    etd: "", eta: "",
  });
  const qc = useQueryClient();
  const create = useServerFn(createShipment);
  const mut = useMutation({
    mutationFn: create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      setOpen(false);
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> New shipment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create shipment</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5"><Label>Carrier</Label><Input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="Maersk, CMA CGM…" /></div>
          <div className="grid gap-1.5">
            <Label>Mode</Label>
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="sea">Sea</option><option value="air">Air</option><option value="road">Road</option><option value="rail">Rail</option>
            </select>
          </div>
          <div className="grid gap-1.5"><Label>Container #</Label><Input value={form.container_number} onChange={(e) => setForm({ ...form, container_number: e.target.value })} /></div>
          <div className="grid gap-1.5">
            <Label>Container type</Label>
            <select value={form.container_type} onChange={(e) => setForm({ ...form, container_type: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option>20GP</option><option>40GP</option><option>40HC</option><option>LCL</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Incoterm</Label>
            <select value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option><option>EXW</option>
            </select>
          </div>
          <div />
          <div className="grid gap-1.5"><Label>Origin port</Label><Input value={form.origin_port} onChange={(e) => setForm({ ...form, origin_port: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Origin country</Label><Input value={form.origin_country} onChange={(e) => setForm({ ...form, origin_country: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Destination port</Label><Input value={form.destination_port} onChange={(e) => setForm({ ...form, destination_port: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Destination country</Label><Input value={form.destination_country} onChange={(e) => setForm({ ...form, destination_country: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>ETD</Label><Input type="date" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>ETA</Label><Input type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={mut.isPending}
            onClick={() => mut.mutate({ data: {
              carrier: form.carrier || undefined,
              mode: form.mode,
              container_number: form.container_number || undefined,
              container_type: form.container_type || undefined,
              incoterm: form.incoterm,
              origin_port: form.origin_port || undefined,
              origin_country: form.origin_country || undefined,
              destination_port: form.destination_port || undefined,
              destination_country: form.destination_country || undefined,
              etd: form.etd || undefined,
              eta: form.eta || undefined,
            } })}
          >
            {mut.isPending ? "Creating…" : "Create shipment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

void Calendar; void CheckCircle2;
