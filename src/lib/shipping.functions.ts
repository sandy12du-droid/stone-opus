// Shipping & Logistics mutation layer.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const createShipment = createServerFn({ method: "POST" })
  .inputValidator((d: {
    carrier?: string;
    mode?: string;
    container_number?: string;
    container_type?: string;
    incoterm?: string;
    origin_port?: string;
    origin_country?: string;
    destination_port?: string;
    destination_country?: string;
    etd?: string;
    eta?: string;
    notes?: string;
  }) =>
    z.object({
      carrier: z.string().optional(),
      mode: z.string().optional(),
      container_number: z.string().optional(),
      container_type: z.string().optional(),
      incoterm: z.string().optional(),
      origin_port: z.string().optional(),
      origin_country: z.string().optional(),
      destination_port: z.string().optional(),
      destination_country: z.string().optional(),
      etd: z.string().optional(),
      eta: z.string().optional(),
      notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: refRow } = await supabaseAdmin.rpc("generate_shipment_reference");
    const reference = (refRow as unknown as string) ?? `SHP-${Date.now()}`;
    const { data: row, error } = await supabaseAdmin
      .from("stone_shipments")
      .insert({
        reference,
        carrier: data.carrier,
        mode: data.mode ?? "sea",
        container_number: data.container_number,
        container_type: data.container_type,
        incoterm: data.incoterm ?? "FOB",
        origin_port: data.origin_port,
        origin_country: data.origin_country,
        destination_port: data.destination_port,
        destination_country: data.destination_country,
        etd: data.etd || null,
        eta: data.eta || null,
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw error;
    await supabaseAdmin.from("stone_shipment_events").insert({
      shipment_id: row!.id,
      event_type: "created",
      location: data.origin_port,
      message: `Shipment ${reference} created`,
      actor: "System",
    });
    return row!;
  });

export const updateShipmentStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string; message?: string; location?: string }) =>
    z.object({
      id: z.string().uuid(),
      status: z.string(),
      message: z.string().optional(),
      location: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    type ShipmentPatch = Partial<{
      status: string;
      actual_departure: string;
      actual_arrival: string;
    }>;
    const patch: ShipmentPatch = { status: data.status };
    if (data.status === "in_transit") patch.actual_departure = today;
    if (data.status === "arrived" || data.status === "delivered") patch.actual_arrival = today;
    const { error } = await supabaseAdmin
      .from("stone_shipments")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("stone_shipment_events").insert({
      shipment_id: data.id,
      event_type: data.status,
      location: data.location,
      message: data.message ?? `Status updated to ${data.status}`,
      actor: "System",
      occurred_at: nowIso,
    });
    return { ok: true };
  });

export const addShipmentEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { shipment_id: string; event_type: string; location?: string; message?: string }) =>
    z.object({
      shipment_id: z.string().uuid(),
      event_type: z.string().min(1),
      location: z.string().optional(),
      message: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin.from("stone_shipment_events").insert({
      shipment_id: data.shipment_id,
      event_type: data.event_type,
      location: data.location,
      message: data.message,
      actor: "System",
    });
    if (error) throw error;
    return { ok: true };
  });
