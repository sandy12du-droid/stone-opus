// Quotations mutation layer — server functions.
// No auth is wired yet in the app, so writes run via the admin client inside
// the handler (never at module scope). When roles ship, gate these with
// requireSupabaseAuth + a role check.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// -------- Helpers --------
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function recomputeTotals(id: string) {
  const supabaseAdmin = await admin();
  const { data: items } = await supabaseAdmin
    .from("stone_quotation_items")
    .select("line_total")
    .eq("quotation_id", id);
  const subtotal = (items ?? []).reduce((s, i) => s + Number(i.line_total ?? 0), 0);
  const { data: q } = await supabaseAdmin
    .from("stone_quotations")
    .select("tax_rate")
    .eq("id", id)
    .maybeSingle();
  const rate = Number(q?.tax_rate ?? 0);
  const tax = Math.round(subtotal * rate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  await supabaseAdmin
    .from("stone_quotations")
    .update({ subtotal, tax_amount: tax, total })
    .eq("id", id);
}

async function logEvent(quotation_id: string, type: string, message: string, actor = "System") {
  const supabaseAdmin = await admin();
  await supabaseAdmin.from("stone_quotation_events").insert({ quotation_id, type, message, actor });
}

// -------- Create --------
export const createQuotation = createServerFn({ method: "POST" })
  .inputValidator((d: {
    customer_name: string;
    customer_company?: string;
    customer_country?: string;
    customer_flag?: string;
    project_name?: string;
    incoterm?: string;
    currency?: string;
    owner_name?: string;
  }) =>
    z
      .object({
        customer_name: z.string().min(1),
        customer_company: z.string().optional(),
        customer_country: z.string().optional(),
        customer_flag: z.string().optional(),
        project_name: z.string().optional(),
        incoterm: z.string().optional(),
        currency: z.string().optional(),
        owner_name: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: row, error } = await supabaseAdmin
      .from("stone_quotations")
      .insert({
        customer_name: data.customer_name,
        customer_company: data.customer_company,
        customer_country: data.customer_country,
        customer_flag: data.customer_flag ?? "🏳️",
        project_name: data.project_name,
        incoterm: data.incoterm ?? "FOB",
        currency: data.currency ?? "USD",
        owner_name: data.owner_name ?? "Unassigned",
      })
      .select("id")
      .single();
    if (error) throw error;
    await logEvent(row.id, "created", "Quotation created");
    return { id: row.id };
  });

// -------- Update header --------
export const updateQuotationHeader = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id: string;
    patch: Partial<{
      customer_name: string;
      customer_company: string | null;
      customer_email: string | null;
      customer_country: string | null;
      customer_flag: string;
      project_name: string | null;
      owner_name: string;
      currency: string;
      incoterm: string;
      valid_until: string | null;
      notes: string | null;
      tax_rate: number;
    }>;
  }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin
      .from("stone_quotations")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw error;
    if ("tax_rate" in data.patch) await recomputeTotals(data.id);
    return { ok: true };
  });

// -------- Add item from product --------
export const addQuotationItem = createServerFn({ method: "POST" })
  .inputValidator((d: { quotation_id: string; product_id: string; quantity?: number }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: p, error: pErr } = await supabaseAdmin
      .from("stone_products")
      .select("id, sku, name, finish, thickness_mm, list_price_per_m2")
      .eq("id", data.product_id)
      .single();
    if (pErr) throw pErr;

    const { data: countRow } = await supabaseAdmin
      .from("stone_quotation_items")
      .select("id", { count: "exact", head: true })
      .eq("quotation_id", data.quotation_id);
    void countRow;

    const qty = data.quantity ?? 1;
    const price = Number(p.list_price_per_m2);
    const { error } = await supabaseAdmin.from("stone_quotation_items").insert({
      quotation_id: data.quotation_id,
      product_id: p.id,
      sku: p.sku,
      description: `${p.name} — ${p.finish} ${p.thickness_mm}mm`,
      finish: p.finish,
      thickness_mm: p.thickness_mm,
      quantity: qty,
      unit: "m²",
      unit_price: price,
      line_total: Math.round(qty * price * 100) / 100,
      position: Date.now() % 100000,
    });
    if (error) throw error;
    await recomputeTotals(data.quotation_id);
    await logEvent(data.quotation_id, "item_added", `Added ${p.name}`);
    return { ok: true };
  });

// -------- Update item --------
export const updateQuotationItem = createServerFn({ method: "POST" })
  .inputValidator((d: {
    id: string;
    quotation_id: string;
    quantity?: number;
    unit_price?: number;
    description?: string;
  }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const patch: Record<string, unknown> = {};
    if (data.description !== undefined) patch.description = data.description;
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.unit_price !== undefined) patch.unit_price = data.unit_price;

    if (data.quantity !== undefined || data.unit_price !== undefined) {
      const { data: current } = await supabaseAdmin
        .from("stone_quotation_items")
        .select("quantity, unit_price")
        .eq("id", data.id)
        .single();
      const q = data.quantity ?? Number(current?.quantity ?? 0);
      const u = data.unit_price ?? Number(current?.unit_price ?? 0);
      patch.line_total = Math.round(q * u * 100) / 100;
    }

    const { error } = await supabaseAdmin
      .from("stone_quotation_items")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    await recomputeTotals(data.quotation_id);
    return { ok: true };
  });

// -------- Remove item --------
export const removeQuotationItem = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; quotation_id: string }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { error } = await supabaseAdmin
      .from("stone_quotation_items")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    await recomputeTotals(data.quotation_id);
    return { ok: true };
  });

// -------- Send (reserves available slabs for linked products) --------
export const sendQuotation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();

    const { data: q, error: qErr } = await supabaseAdmin
      .from("stone_quotations")
      .select("id, number, valid_until, status")
      .eq("id", data.id)
      .single();
    if (qErr) throw qErr;
    if (q.status !== "draft" && q.status !== "in_review") {
      throw new Error(`Cannot send a quotation in status "${q.status}"`);
    }

    // Best-effort slab reservation: reserve up to `ceil(quantity/3.2)` available
    // slabs per product (3.2 m² average slab). Silent if none available.
    const { data: items } = await supabaseAdmin
      .from("stone_quotation_items")
      .select("product_id, quantity")
      .eq("quotation_id", data.id);

    let reservedCount = 0;
    for (const it of items ?? []) {
      if (!it.product_id) continue;
      const need = Math.max(1, Math.ceil(Number(it.quantity) / 3.2));
      const { data: slabs } = await supabaseAdmin
        .from("stone_slabs")
        .select("id")
        .eq("product_id", it.product_id)
        .eq("status", "available")
        .limit(need);
      const ids = (slabs ?? []).map((s) => s.id);
      if (ids.length === 0) continue;
      await supabaseAdmin
        .from("stone_slabs")
        .update({
          status: "reserved",
          reserved_for: q.number,
          reserved_until: q.valid_until,
        })
        .in("id", ids);
      reservedCount += ids.length;
    }

    await supabaseAdmin
      .from("stone_quotations")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);

    await logEvent(
      data.id,
      "sent",
      reservedCount > 0
        ? `Quotation sent — ${reservedCount} slab(s) reserved`
        : "Quotation sent",
    );
    return { ok: true, reserved: reservedCount };
  });

// -------- Decision --------
export const decideQuotation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; decision: "accepted" | "rejected" }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: q } = await supabaseAdmin
      .from("stone_quotations")
      .select("number")
      .eq("id", data.id)
      .single();

    await supabaseAdmin
      .from("stone_quotations")
      .update({ status: data.decision, decided_at: new Date().toISOString() })
      .eq("id", data.id);

    if (data.decision === "rejected" && q) {
      // Release slabs previously held for this quotation.
      await supabaseAdmin
        .from("stone_slabs")
        .update({ status: "available", reserved_for: null, reserved_until: null })
        .eq("reserved_for", q.number);
    }

    await logEvent(
      data.id,
      data.decision,
      data.decision === "accepted"
        ? "Customer accepted quotation"
        : "Customer rejected quotation — slabs released",
      "Customer",
    );
    return { ok: true };
  });

// -------- Delete --------
export const deleteQuotation = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabaseAdmin = await admin();
    const { data: q } = await supabaseAdmin
      .from("stone_quotations")
      .select("number")
      .eq("id", data.id)
      .single();
    if (q) {
      await supabaseAdmin
        .from("stone_slabs")
        .update({ status: "available", reserved_for: null, reserved_until: null })
        .eq("reserved_for", q.number);
    }
    const { error } = await supabaseAdmin.from("stone_quotations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
