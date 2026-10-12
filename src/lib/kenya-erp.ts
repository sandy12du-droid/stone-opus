import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const kenyaSections = {
  overview: "Financial Overview", customers: "Customers", suppliers: "Suppliers",
  invoices: "Sales Invoices", sales_orders: "Sales Orders", purchase_orders: "Purchase Orders",
  bills: "Purchase Bills", payments: "Payments", expenses: "Expenses",
  accounts: "Chart of Accounts", journals: "Journal Entries", ledger: "General Ledger",
  receivables: "Accounts Receivable", payables: "Accounts Payable", reports: "Financial Reports",
  tax: "Tax / eTIMS", audit: "Business Audit Trail", settings: "Company Settings",
} as const;
export type KenyaSection = keyof typeof kenyaSections;
export function isKenyaSection(value: string): value is KenyaSection { return value in kenyaSections; }

export const kenyaOptions = (warehouseId: string) => queryOptions({
  queryKey: ["kenya-erp", warehouseId],
  queryFn: async () => {
    const result = await supabase.from("erp_companies").select("*").eq("warehouse_id", warehouseId).maybeSingle();
    if (result.error) throw result.error;
    const company = result.data;
    if (!company) return null;
    const [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership] = await Promise.all([
      supabase.from("erp_parties").select("*").eq("company_id", company.id).order("name"),
      supabase.from("erp_accounts").select("*").eq("company_id", company.id).order("code"),
      supabase.from("erp_tax_codes").select("*").eq("company_id", company.id).order("rate", { ascending: false }),
      supabase.from("erp_documents").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("erp_document_items").select("*").eq("company_id", company.id),
      supabase.from("erp_payments").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("erp_journals").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
      supabase.from("erp_journal_lines").select("*").eq("company_id", company.id),
      supabase.from("erp_audit_events").select("*").eq("company_id", company.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("erp_memberships").select("role").eq("company_id", company.id),
    ]);
    for (const response of [parties, accounts, taxes, documents, items, payments, journals, lines, audit, membership]) {
      if (response.error) throw response.error;
    }
    return { company, parties: parties.data ?? [], accounts: accounts.data ?? [], taxes: taxes.data ?? [], documents: documents.data ?? [], items: items.data ?? [], payments: payments.data ?? [], journals: journals.data ?? [], lines: lines.data ?? [], audit: audit.data ?? [], role: membership.data?.[0]?.role ?? "viewer" };
  },
});
export type KenyaData = NonNullable<Awaited<ReturnType<ReturnType<typeof kenyaOptions>["queryFn"]>>>;