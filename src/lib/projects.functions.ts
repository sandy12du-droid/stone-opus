// Projects & Production mutation layer.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// -------- Create project --------
export const createProject = createServerFn({ method: "POST" })
  .inputValidator((d: {
    name: string;
    customer_name?: string;
    customer_country?: string;
    priority?: string;
    po_number?: string;
    currency?: string;
    contract_value?: number;
    target_delivery_date?: string;
    notes?: string;
  }) =>
    z.object({
      name: z.string().min(1),
      customer_name: z.string().optional(),
      customer_country: z.string().optional(),
      priority: z.string().optional(),
      po_number: z.string().optional(),
      currency: z.string().optional(),
      contract_value: z.number().optional(),
      target_delivery_date: z.string().optional(),
      notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: codeRow } = await supabaseAdmin.rpc("generate_project_code");
    const code = (codeRow as unknown as string) ?? `PRJ-${Date.now()}`;
    const { data: row, error } = await supabaseAdmin
      .from("stone_projects")
      .insert({
        code,
        name: data.name,
        customer_name: data.customer_name,
        customer_country: data.customer_country,
        priority: data.priority ?? "normal",
        po_number: data.po_number,
        currency: data.currency ?? "USD",
        contract_value: data.contract_value ?? 0,
        target_delivery_date: data.target_delivery_date || null,
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw error;
    return row!;
  });

// -------- Update project status --------
export const updateProjectStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) =>
    z.object({ id: z.string().uuid(), status: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin
      .from("stone_projects")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// -------- Add work order --------
export const addWorkOrder = createServerFn({ method: "POST" })
  .inputValidator((d: {
    project_id: string;
    title: string;
    quantity?: number;
    unit?: string;
    assigned_to?: string;
    due_date?: string;
  }) =>
    z.object({
      project_id: z.string().uuid(),
      title: z.string().min(1),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      assigned_to: z.string().optional(),
      due_date: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: codeRow } = await supabaseAdmin.rpc("generate_work_order_code");
    const code = (codeRow as unknown as string) ?? `WO-${Date.now()}`;
    const { data: row, error } = await supabaseAdmin
      .from("stone_work_orders")
      .insert({
        project_id: data.project_id,
        code,
        title: data.title,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? "slab",
        assigned_to: data.assigned_to,
        due_date: data.due_date || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    await supabaseAdmin.from("stone_production_events").insert({
      work_order_id: row!.id,
      event_type: "created",
      to_stage: "queued",
      message: `Work order created: ${data.title}`,
      actor: "System",
    });
    return row!;
  });

// -------- Advance work-order stage --------
export const advanceWorkOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; to_stage: string; message?: string }) =>
    z.object({
      id: z.string().uuid(),
      to_stage: z.string(),
      message: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: current } = await supabaseAdmin
      .from("stone_work_orders")
      .select("stage")
      .eq("id", data.id)
      .maybeSingle();
    const from_stage = current?.stage ?? null;
    const nowIso = new Date().toISOString();
    type WorkOrderPatch = Partial<{
      stage: string;
      status: string;
      started_at: string;
      completed_at: string;
    }>;
    const patch: WorkOrderPatch = { stage: data.to_stage };
    if (data.to_stage === "shipped" || data.to_stage === "ready") {
      patch.completed_at = nowIso;
      if (data.to_stage === "shipped") patch.status = "completed";
    }
    if (from_stage === "queued" && data.to_stage !== "queued") {
      patch.started_at = nowIso;
    }
    const { error } = await supabaseAdmin
      .from("stone_work_orders")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("stone_production_events").insert({
      work_order_id: data.id,
      event_type: "stage_change",
      from_stage,
      to_stage: data.to_stage,
      message: data.message ?? `Moved to ${data.to_stage}`,
      actor: "System",
    });
    return { ok: true };
  });
