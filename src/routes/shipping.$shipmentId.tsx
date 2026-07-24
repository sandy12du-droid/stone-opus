import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Ship, Plane, Truck, MapPin, Calendar, Package, ChevronRight,
  Plus, Anchor, Send,
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
  shipmentDetailOptions, STATUS_LABEL, STATUS_TONE, SHIPMENT_STATUSES,
  MODE_LABEL, transitProgress, fmtDate, currency,
} from "@/lib/shipping-queries";
import { updateShipmentStatus, addShipmentEvent } from "@/lib/shipping.functions";
import { useSetBusinessContext } from "@/context/BusinessContext";

export const Route = createFileRoute("/shipping/$shipmentId")({
  head: ({ loaderData }) => {
    const s = loaderData as { reference: string } | undefined;
    if (!s) return { meta: [{ title: "Shipment — Arquane OS" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${s.reference} — Shipping · Arquane OS` },
        { name: "description", content: `Tracking and freight detail for shipment ${s.reference}.` },
        { property: "og:title", content: `${s.reference} — Arquane OS` },
        { property: "og:description", content: `Live tracking and freight detail for ${s.reference}.` },
      ],
    };
  },
  loader: async ({ params, context }) => {
    const s = await context.queryClient.ensureQueryData(shipmentDetailOptions(params.shipmentId));
    if (!s) throw notFound();
    return s;
  },
  errorComponent: ({ error }) => (
    <AppShell title="Shipment"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Shipment"><div className="text-sm text-muted-foreground">Shipment not found. <Link to="/shipping" className="text-primary underline">Back to shipping</Link></div></AppShell>
  ),
  component: ShipmentDetail,
});

const MODE_ICON: Record<string, React.ComponentType<{ className?: string }>> = { sea: Ship, air: Plane, road: Truck, rail: Truck };

function ShipmentDetail() {
  const { shipmentId } = Route.useParams();
  const { data: shipment } = useSuspenseQuery(shipmentDetailOptions(shipmentId));
  if (!shipment) return null;

  const qc = useQueryClient();
  const updateStatus = useServerFn(updateShipmentStatus);
  const statusMut = useMutation({ mutationFn: updateStatus, onSuccess: () => qc.invalidateQueries({ queryKey: ["shipments"] }) });

  const ModeIcon = MODE_ICON[shipment.mode] ?? Ship;
  const progress = transitProgress(shipment);

  return (
    <AppShell title={shipment.reference} subtitle={`${shipment.carrier ?? "Carrier TBD"} · ${MODE_LABEL[shipment.mode] ?? shipment.mode}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/shipping"><ArrowLeft className="mr-1 h-4 w-4" /> All shipments</Link></Button>
      </div>

      {/* Route + status card */}
      <div className="mb-5 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ModeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">{shipment.reference}</div>
              <div className="text-xs text-muted-foreground">
                {shipment.container_number ? `${shipment.container_number} · ` : ""}{shipment.container_type ?? "—"} · Incoterm {shipment.incoterm}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", STATUS_TONE[shipment.status])}>
              {STATUS_LABEL[shipment.status] ?? shipment.status}
            </span>
            <select
              value={shipment.status}
              onChange={(e) => statusMut.mutate({ data: { id: shipment.id, status: e.target.value } })}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
            >
              {SHIPMENT_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-sm font-semibold text-foreground"><Anchor className="h-3.5 w-3.5 text-muted-foreground" /> {shipment.origin_port ?? "Origin"}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{shipment.origin_country ?? ""}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">ETD {fmtDate(shipment.etd)}</div>
          </div>
          <div className="relative flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="absolute inset-x-0 -top-4 flex justify-center text-[10px] uppercase tracking-wide text-muted-foreground">{progress}%</div>
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center justify-end gap-1 text-sm font-semibold text-foreground"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {shipment.destination_port ?? "Destination"}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{shipment.destination_country ?? ""}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">ETA {fmtDate(shipment.eta)}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 md:grid-cols-4">
          <Meta label="Weight">{shipment.weight_kg ? `${Number(shipment.weight_kg).toLocaleString()} kg` : "—"}</Meta>
          <Meta label="Volume">{shipment.volume_m3 ? `${Number(shipment.volume_m3).toLocaleString()} m³` : "—"}</Meta>
          <Meta label="Freight cost">{shipment.freight_cost ? currency(Number(shipment.freight_cost), shipment.currency ?? "USD") : "—"}</Meta>
          <Meta label="Bill of lading">{shipment.bill_of_lading ?? "—"}</Meta>
        </div>
        {shipment.notes && <div className="mt-3 text-sm text-muted-foreground">Note: {shipment.notes}</div>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Line items */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Line items</h2>
          <div className="space-y-2">
            {shipment.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
                No line items linked to this shipment.
              </div>
            )}
            {shipment.items.map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">{it.description}</span>
                  </div>
                  {it.project && (
                    <Link to="/projects/$projectId" params={{ projectId: it.project.id }} className="ml-6 mt-0.5 block text-xs text-primary hover:underline">
                      {it.project.code} · {it.project.name}
                    </Link>
                  )}
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  <div className="tabular-nums text-foreground">{it.quantity} {it.unit}</div>
                  <div>{it.weight_kg ? `${Number(it.weight_kg).toLocaleString()} kg` : ""}{it.volume_m3 ? ` · ${Number(it.volume_m3).toLocaleString()} m³` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking timeline */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tracking</h2>
            <AddEventDialog shipmentId={shipment.id} />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            {shipment.events.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">No tracking events yet.</div>
            )}
            <ol className="space-y-4">
              {shipment.events.map((e, i) => (
                <li key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("h-2.5 w-2.5 rounded-full", i === 0 ? "bg-primary ring-4 ring-primary/20" : "bg-muted-foreground/40")} />
                    {i < shipment.events.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium capitalize text-foreground">{e.event_type.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-muted-foreground">{fmtDate(e.occurred_at)}</span>
                    </div>
                    {e.location && <div className="text-xs text-muted-foreground">{e.location}</div>}
                    {e.message && <div className="mt-0.5 text-xs text-muted-foreground">{e.message}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function AddEventDialog({ shipmentId }: { shipmentId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ event_type: "milestone", location: "", message: "" });
  const qc = useQueryClient();
  const add = useServerFn(addShipmentEvent);
  const mut = useMutation({
    mutationFn: add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      setOpen(false);
      setForm({ event_type: "milestone", location: "", message: "" });
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add tracking event</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Event type</Label>
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="milestone">Milestone</option>
              <option value="loaded">Loaded</option>
              <option value="departed">Departed</option>
              <option value="arrived">Arrived</option>
              <option value="customs">Customs clearance</option>
              <option value="delivered">Delivered</option>
              <option value="delay">Delay</option>
            </select>
          </div>
          <div className="grid gap-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Port or city" /></div>
          <div className="grid gap-1.5"><Label>Message</Label><Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={mut.isPending} onClick={() => mut.mutate({ data: { shipment_id: shipmentId, event_type: form.event_type, location: form.location || undefined, message: form.message || undefined } })}>
            <Send className="mr-1.5 h-4 w-4" /> {mut.isPending ? "Adding…" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

void ChevronRight; void Calendar;
