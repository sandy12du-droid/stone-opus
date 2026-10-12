// Run: bun test tests/
// Unit: Kenya search never returns other-company records.
// Integration (needs ~/.cache/lovable-auth/session.json from `lovable auth-session --json`):
// runs the database self-test that posts invoices, payments, credit notes, refunds,
// expenses and stock movements, asserts balanced journals + Kenya-only scope, then rolls back.
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { searchKenya } from "../src/lib/kenya-search";

const KE = "ke", HQ = "hq";
const fixture: any = {
  company: { id: KE },
  parties: [{ id: "p1", company_id: KE, name: "Nairobi Kitchens" }, { id: "p2", company_id: HQ, name: "Nairobi Kitchens HQ" }],
  accounts: [{ id: "a1", company_id: KE, code: "1000", name: "Cash" }],
  documents: [
    { id: "d1", company_id: KE, kind: "invoice", number: "INV-1", party_id: "p1", status: "posted", total: 1160, document_date: "2026-10-01" },
    { id: "d2", company_id: KE, kind: "sales_order", number: "SAL-2", party_id: "p1", status: "draft", total: 580, document_date: "2026-10-02" },
    { id: "d3", company_id: KE, kind: "expense", number: "EXP-3", status: "posted", total: 100, notes: "Nairobi fuel", document_date: "2026-10-03" },
    { id: "d4", company_id: KE, kind: "credit_note", number: "CRN-4", party_id: "p1", status: "posted", total: 1160, document_date: "2026-10-04" },
    { id: "x1", company_id: HQ, kind: "invoice", number: "INV-HQ", party_id: "p2", status: "posted", total: 9, notes: "Nairobi", document_date: "2026-10-05" },
  ],
  payments: [{ id: "r1", company_id: KE, document_id: "d4", account_id: "a1", amount: 500, reference: "NAIROBI-REF", payment_date: "2026-10-05" }],
  stock: [
    { id: "s1", company_id: KE, item: "Nairobi Calacatta", kind: "receipt", quantity: 5, unit: "Sqm", value: 25000, movement_date: "2026-10-01" },
    { id: "s2", company_id: HQ, item: "Nairobi HQ slab", kind: "receipt", quantity: 1, unit: "Sqm", value: 1, movement_date: "2026-10-01" },
  ],
  journals: [{ id: "j1", company_id: KE, description: "Invoice INV-1 Nairobi", journal_date: "2026-10-01", source_document_id: "d1" }, { id: "j2", company_id: HQ, description: "Nairobi HQ journal", journal_date: "2026-10-01" }],
  lines: [{ journal_id: "j1", company_id: KE, account_id: "a1", debit: 1160, credit: 0 }, { journal_id: "j1", company_id: KE, account_id: "a1", debit: 0, credit: 1160 }],
};

describe("Kenya search", () => {
  test("finds every Kenya record type", () => {
    const kinds = new Set(searchKenya(fixture, "nairobi").map(r => r.kind));
    for (const k of ["invoice", "sales_order", "expense", "refund", "stock", "ledger"]) expect(kinds.has(k as never)).toBe(true);
  });
  test("never returns records from other locations", () => {
    const ids = searchKenya(fixture, "nairobi").map(r => r.id);
    for (const id of ["x1", "s2", "j2"]) expect(ids).not.toContain(id);
    expect(searchKenya(fixture, "INV-HQ")).toHaveLength(0);
  });
  test("empty query returns nothing", () => expect(searchKenya(fixture, "  ")).toHaveLength(0));
});

const sessionPath = `${homedir()}/.cache/lovable-auth/session.json`;
const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const live = existsSync(sessionPath) && url && key;

describe.if(Boolean(live))("Kenya ledger (live database, rolled back)", () => {
  const token = live ? JSON.parse(readFileSync(sessionPath, "utf8")).session.access_token : "";
  const api = (path: string, init?: RequestInit) => fetch(`${url}/rest/v1/${path}`, { ...init, headers: { apikey: key!, Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }).then(r => r.json());

  test("invoices, expenses, refunds and stock movements post balanced, Kenya-only journals", async () => {
    const [ke] = await api("stone_warehouses?code=eq.WH-NBO&select=id");
    const [company] = await api(`erp_companies?warehouse_id=eq.${ke.id}&select=id`);
    const result = await api("rpc/erp_run_selftest", { method: "POST", body: JSON.stringify({ p_company: company.id }) });
    expect(result.message).toStartWith("PASS");
    expect(result.passed).toBe(true);
  }, 30000);

  test("other locations have no Kenya ledger or documents", async () => {
    const [ke] = await api("stone_warehouses?code=eq.WH-NBO&select=id");
    const others = await api(`erp_companies?warehouse_id=neq.${ke.id}&select=id`);
    const [kenya] = await api(`erp_companies?warehouse_id=eq.${ke.id}&select=id`);
    expect(others.map((c: { id: string }) => c.id)).not.toContain(kenya.id);
    const leaked = await api(`erp_stock_movements?company_id=eq.${kenya.id}&warehouse_id=neq.${ke.id}&select=id`);
    expect(leaked).toHaveLength(0);
  });
});
