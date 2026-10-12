import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const readKenya = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ warehouseId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const result = await db.from("erp_companies").select("*").eq("warehouse_id", data.warehouseId).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    const company = result.data;
    if (!company) return null;
    const [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership, stock] = await Promise.all([
      db.from("erp_parties").select("*").eq("company_id", company.id).order("name").limit(10000),
      db.from("erp_accounts").select("*").eq("company_id", company.id).order("code").limit(10000),
      db.from("erp_tax_codes").select("*").eq("company_id", company.id).order("rate", { ascending: false }),
      db.from("erp_documents").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(10000),
      db.from("erp_document_items").select("*").eq("company_id", company.id).limit(10000),
      db.from("erp_payments").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(10000),
      db.from("erp_journals").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(10000),
      db.from("erp_journal_lines").select("*").eq("company_id", company.id).limit(10000),
      db.from("erp_audit_events").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(200),
      db.from("erp_memberships").select("role").eq("company_id", company.id).eq("user_id", context.userId),
      db.from("erp_stock_movements").select("*").eq("company_id", company.id).eq("warehouse_id", data.warehouseId).order("created_at", { ascending: false }).limit(10000),
    ]);
    for (const response of [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership, stock]) if (response.error) throw new Error(response.error.message);
    for (const response of [parties, documents, items, payments, journals, lines]) if ((response.data?.length ?? 0) >= 1000) throw new Error("This company needs paginated reporting before additional records can be summarized safely.");
    return { company, parties: parties.data ?? [], accounts: accounts.data ?? [], taxes: taxes.data ?? [], documents: documents.data ?? [], items: items.data ?? [], payments: payments.data ?? [], journals: journals.data ?? [], lines: lines.data ?? [], audit: audit.data ?? [], role: membership.data?.[0]?.role ?? "viewer", stock: stock.data ?? [] };
  });

const text = z.string().trim().max(500);
export const saveKenyaParty = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid().optional(), company_id: z.string().uuid(), kind: z.enum(["customer", "supplier"]), name: text.min(1), company_name: text, kra_pin: text, phone: text, whatsapp: text, email: z.union([z.literal(""), z.email()]), address: text, city: text, county: text, contact_person: text, credit_limit: z.number().min(0), payment_terms: z.number().int().min(0).max(365), currency: z.string().regex(/^[A-Z]{3}$/), customer_type: text, bank_details: text, notes: text, vat_registered: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { id, ...row } = data;
    const query = id ? context.supabase.from("erp_parties").update(row).eq("id", id).eq("company_id", row.company_id) : context.supabase.from("erp_parties").insert(row);
    const result = await query.select("id").single();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });
const rpcError = (e: { message: string } | null) => { if (e) throw new Error(e.message); };
const invoiceItem = z.object({ description: text.min(1), stock_item: text, quantity: z.number().positive(), unit: z.string().trim().min(1).max(20), unit_price: z.number().min(0), discount: z.number().min(0), tax_code_id: z.string().uuid() });
export const createKenyaInvoice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ company_id: z.string().uuid(), party_id: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().max(2000), items: z.array(invoiceItem).min(1).max(100) }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase.rpc("erp_create_invoice", { p_company: data.company_id, p_party: data.party_id, p_date: data.date, p_due: data.due, p_notes: data.notes, p_items: data.items });
    rpcError(r.error); return { id: r.data as string };
  });
export const postKenyaInvoice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ document_id: z.string().uuid() }))
  .handler(async ({ data, context }) => { const r = await context.supabase.rpc("erp_post_invoice", { p_document: data.document_id }); rpcError(r.error); return { journal: r.data as string }; });
export const recordKenyaPayment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ document_id: z.string().uuid(), account_id: z.string().uuid(), amount: z.number().positive(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reference: text.min(1) }))
  .handler(async ({ data, context }) => { const r = await context.supabase.rpc("erp_record_payment", { p_document: data.document_id, p_account: data.account_id, p_amount: Math.round(data.amount * 100) / 100, p_date: data.date, p_reference: data.reference }); rpcError(r.error); return { id: r.data as string }; });
export const recordKenyaStock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ company_id: z.string().uuid(), kind: z.enum(["receipt", "transfer", "adjustment"]), item: text.min(1).max(200), unit: z.string().trim().min(1).max(20), quantity: z.number().refine(n => n !== 0), unit_cost: z.number().min(0), from_bin: text, to_bin: text, reference: text, reason: text, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase.rpc("erp_record_stock_movement", { p_company: data.company_id, p_kind: data.kind, p_item: data.item, p_unit: data.unit, p_quantity: data.quantity, p_unit_cost: data.unit_cost, p_from: data.from_bin, p_to: data.to_bin, p_reference: data.reference, p_reason: data.reason, p_date: data.date });
    rpcError(r.error); return { id: r.data as string };
  });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const createKenyaPurchaseOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ company_id: z.string().uuid(), party_id: z.string().uuid(), date: isoDate, due: isoDate, notes: z.string().max(2000), items: z.array(invoiceItem).min(1).max(100) }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase.rpc("erp_create_purchase_order", { p_company: data.company_id, p_party: data.party_id, p_date: data.date, p_due: data.due, p_notes: data.notes, p_items: data.items });
    rpcError(r.error); return { id: r.data as string };
  });
export const receiveKenyaPurchaseOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ document_id: z.string().uuid(), supplier_ref: text.min(1), date: isoDate, bin: text }))
  .handler(async ({ data, context }) => { const r = await context.supabase.rpc("erp_receive_purchase_order", { p_po: data.document_id, p_supplier_ref: data.supplier_ref, p_date: data.date, p_bin: data.bin }); rpcError(r.error); return { id: r.data as string }; });
export const creditKenyaInvoice = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ document_id: z.string().uuid(), reason: text.min(1), date: isoDate }))
  .handler(async ({ data, context }) => { const r = await context.supabase.rpc("erp_credit_invoice", { p_invoice: data.document_id, p_reason: data.reason, p_date: data.date }); rpcError(r.error); return { id: r.data as string }; });
