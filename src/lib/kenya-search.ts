// Searches only the records already loaded for the active Kenya company.
// Every result is filtered by company_id so nothing from other locations can surface.
import type { KenyaData, KenyaSection } from "@/lib/kenya-erp";

export type KenyaSearchKind = "invoice" | "sales_order" | "expense" | "refund" | "stock" | "ledger" | "credit_note" | "bill" | "purchase_order";
export interface KenyaSearchResult { id: string; kind: KenyaSearchKind; label: string; sub: string; amount: number | null; date: string; section: KenyaSection }

type SearchInput = Pick<KenyaData, "company" | "documents" | "parties" | "payments" | "stock" | "journals" | "lines" | "accounts">;
const docKinds: Record<string, [KenyaSearchKind, KenyaSection]> = {
  invoice: ["invoice", "invoices"], sales_order: ["sales_order", "sales_orders"], expense: ["expense", "expenses"],
  credit_note: ["credit_note", "invoices"], bill: ["bill", "bills"], purchase_order: ["purchase_order", "purchase_orders"],
};

export function searchKenya(data: SearchInput, query: string, limit = 50): KenyaSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const co = data.company.id;
  const hit = (...parts: unknown[]) => parts.join(" ").toLowerCase().includes(q);
  const party = new Map(data.parties.filter(p => p.company_id === co).map(p => [p.id, p.name]));
  const docs = data.documents.filter(d => d.company_id === co);
  const docById = new Map(docs.map(d => [d.id, d]));
  const account = new Map(data.accounts.filter(a => a.company_id === co).map(a => [a.id, `${a.code} ${a.name}`]));
  const out: KenyaSearchResult[] = [];

  for (const d of docs) {
    const map = docKinds[d.kind]; if (!map) continue;
    const name = d.party_id ? party.get(d.party_id) ?? "" : "";
    if (hit(d.number, name, d.notes, d.supplier_reference, d.status, d.kind.replace("_", " "))) out.push({ id: d.id, kind: map[0], label: d.number, sub: [name, d.status].filter(Boolean).join(" · "), amount: Number(d.total), date: d.document_date, section: map[1] });
  }
  for (const p of data.payments.filter(p => p.company_id === co)) {
    const d = docById.get(p.document_id); if (d?.kind !== "credit_note") continue;
    if (hit(p.reference, d.number, "refund", d.party_id ? party.get(d.party_id) : "")) out.push({ id: p.id, kind: "refund", label: `Refund ${p.reference}`, sub: `${d.number} · ${account.get(p.account_id) ?? ""}`, amount: Number(p.amount), date: p.payment_date, section: "invoices" });
  }
  for (const m of data.stock.filter(m => m.company_id === co)) {
    if (hit(m.item, m.reference, m.reason, m.kind, m.from_bin, m.to_bin)) out.push({ id: m.id, kind: "stock", label: m.item, sub: `${m.kind} · ${Number(m.quantity)} ${m.unit}${m.reference ? ` · ${m.reference}` : ""}`, amount: Number(m.value), date: m.movement_date, section: "stock" });
  }
  const lineTotals = new Map<string, { total: number; accounts: string[] }>();
  for (const l of data.lines.filter(l => l.company_id === co)) {
    const e = lineTotals.get(l.journal_id) ?? { total: 0, accounts: [] };
    e.total += Number(l.debit); e.accounts.push(account.get(l.account_id) ?? ""); lineTotals.set(l.journal_id, e);
  }
  for (const j of data.journals.filter(j => j.company_id === co)) {
    const e = lineTotals.get(j.id);
    const src = j.source_document_id ? docById.get(j.source_document_id)?.number : "";
    if (hit(j.description, src, ...(e?.accounts ?? []))) out.push({ id: j.id, kind: "ledger", label: j.description, sub: ["Ledger entry", src].filter(Boolean).join(" · "), amount: e?.total ?? 0, date: j.journal_date, section: "journals" });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
