// Shipping & Logistics read layer.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ShipmentRow = Database["public"]["Tables"]["stone_shipments"]["Row"];
export type ShipmentItem = Database["public"]["Tables"]["stone_shipment_items"]["Row"];
export type ShipmentEvent = Database["public"]["Tables"]["stone_shipment_events"]["Row"];

export type ShipmentWithRefs = ShipmentRow & {
  items: (ShipmentItem & { project?: { id: string; name: string; code: string } | null })[];
  events: ShipmentEvent[];
};

export const SHIPMENT_STATUSES = [
  "planned", "booked", "in_transit", "arrived", "customs", "delivered", "delayed", "cancelled",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  booked: "Booked",
  in_transit: "In transit",
  arrived: "Arrived",
  customs: "Customs",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  booked: "bg-info/15 text-info",
  in_transit: "bg-primary/15 text-primary",
  arrived: "bg-accent/20 text-accent-foreground",
  customs: "bg-warning/15 text-warning",
  delivered: "bg-success/15 text-success",
  delayed: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export const MODE_LABEL: Record<string, string> = { sea: "Sea", air: "Air", road: "Road", rail: "Rail" };

export const currency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export function transitProgress(s: ShipmentRow): number {
  if (s.status === "delivered") return 100;
  if (s.status === "cancelled") return 0;
  const etd = s.actual_departure ?? s.etd;
  const eta = s.eta;
  if (!etd || !eta) return s.status === "planned" ? 5 : s.status === "booked" ? 15 : 50;
  const start = new Date(etd).getTime();
  const end = new Date(eta).getTime();
  const now = Date.now();
  if (now <= start) return 10;
  if (now >= end) return s.actual_arrival ? 95 : 90;
  return Math.round(10 + ((now - start) / (end - start)) * 80);
}

export const shipmentsListOptions = () =>
  queryOptions({
    queryKey: ["shipments", "list"],
    staleTime: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stone_shipments")
        .select("*, items:stone_shipment_items(id, project_id, description, quantity, unit)")
        .order("etd", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const shipmentDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ["shipments", "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ShipmentWithRefs | null> => {
      const { data, error } = await supabase
        .from("stone_shipments")
        .select("*, items:stone_shipment_items(*, project:stone_projects(id, name, code)), events:stone_shipment_events(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const d = data as unknown as ShipmentWithRefs;
      d.events = [...(d.events ?? [])].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
      );
      return d;
    },
  });
