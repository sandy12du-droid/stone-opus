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
    const [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership] = await Promise.all([
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
    ]);
    for (const response of [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership]) if (response.error) throw new Error(response.error.message);
    for (const response of [parties, documents, items, payments, journals, lines]) if ((response.data?.length ?? 0) >= 1000) throw new Error("This company needs paginated reporting before additional records can be summarized safely.");
    return { company, parties: parties.data ?? [], accounts: accounts.data ?? [], taxes: taxes.data ?? [], documents: documents.data ?? [], items: items.data ?? [], payments: payments.data ?? [], journals: journals.data ?? [], lines: lines.data ?? [], audit: audit.data ?? [], role: membership.data?.[0]?.role ?? "viewer" };
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