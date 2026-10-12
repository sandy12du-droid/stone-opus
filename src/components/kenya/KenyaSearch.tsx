import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Download, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatMoney } from "@/lib/location";
import { searchKenya, type KenyaSearchKind, type KenyaSearchResult } from "@/lib/kenya-search";
import { runKenyaSelfTest } from "@/lib/kenya-erp.functions";
import { downloadCsv } from "./KenyaFinance";
import type { KenyaData } from "@/lib/kenya-erp";

const kindLabel: Record<KenyaSearchKind, string> = { invoice: "Invoice", sales_order: "Sales order", expense: "Expense", refund: "Refund", stock: "Stock movement", ledger: "Ledger entry", credit_note: "Credit note", bill: "Bill", purchase_order: "Purchase order" };
const selectClass = "h-9 rounded-md border border-input bg-background px-3 text-sm";

export function KenyaSearch({ data }: { data: KenyaData }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"" | KenyaSearchKind>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<KenyaSearchResult | null>(null);
  const filtering = Boolean(q.trim() || kind || from || to);
  const results = useMemo(() => filtering ? searchKenya(data, q, { kind: kind || undefined, from: from || undefined, to: to || undefined, limit: 500 }) : [], [data, q, kind, from, to, filtering]);
  const exportCsv = () => downloadCsv(`kenya-search-${new Date().toISOString().slice(0, 10)}.csv`,
    ["Company", "Query", "Type filter", "From", "To", "Record", "Type", "Details", "Date", "Amount KES", "Record ID"],
    results.map(r => [data.company.name, q.trim(), kind ? kindLabel[kind] : "All", from, to, r.label, kindLabel[r.kind], r.sub, r.date, r.amount, r.id]));
  return <>
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Search Kenya records" placeholder="Number, customer, item, reference…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
      <label className="text-xs text-muted-foreground">Type<select aria-label="Record type" className={`${selectClass} mt-1 block`} value={kind} onChange={e => setKind(e.target.value as KenyaSearchKind | "")}><option value="">All records</option>{(Object.keys(kindLabel) as KenyaSearchKind[]).map(k => <option key={k} value={k}>{kindLabel[k]}</option>)}</select></label>
      <label className="text-xs text-muted-foreground">From<Input type="date" aria-label="From date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1" /></label>
      <label className="text-xs text-muted-foreground">To<Input type="date" aria-label="To date" value={to} onChange={e => setTo(e.target.value)} className="mt-1" /></label>
      {filtering && <Button size="sm" variant="ghost" onClick={() => { setQ(""); setKind(""); setFrom(""); setTo(""); }}>Clear</Button>}
      <Button size="sm" variant="outline" className="ml-auto" disabled={results.length === 0} onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV ({results.length})</Button>
    </div>
    {!filtering ? <p className="border-y border-border py-8 text-sm text-muted-foreground">Search or filter to see {data.company.name} records. Results never include other locations.</p>
      : results.length === 0 ? <p className="border-y border-border py-8 text-sm text-muted-foreground">No Kenya records match these filters.</p>
      : <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Record</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{results.map(r => <TableRow key={`${r.kind}:${r.id}`}><TableCell><Button variant="link" className="h-auto p-0 font-medium text-foreground" onClick={() => setOpen(r)}>{r.label}</Button><p className="mt-1 text-xs capitalize text-muted-foreground">{r.sub}</p></TableCell><TableCell>{kindLabel[r.kind]}</TableCell><TableCell className="tabular-nums">{r.date}</TableCell><TableCell className="text-right tabular-nums">{r.amount === null ? "—" : formatMoney(r.amount, "KES")}</TableCell></TableRow>)}</TableBody></Table></div>}
    <RecordDetails data={data} result={open} onClose={() => setOpen(null)} />
    {["owner", "accountant", "manager"].includes(data.role) && <SelfTest companyId={data.company.id} />}
  </>;
}

function RecordDetails({ data, result, onClose }: { data: KenyaData; result: KenyaSearchResult | null; onClose: () => void }) {
  const money = (n: unknown) => formatMoney(Number(n), "KES");
  const account = new Map(data.accounts.map(a => [a.id, `${a.code} ${a.name}`]));
  const doc = result ? data.documents.find(d => d.id === result.id) : undefined;
  const stock = result?.kind === "stock" ? data.stock.find(s => s.id === result.id) : undefined;
  const journalIds = !result ? [] : result.kind === "ledger" ? [result.id] : data.journals.filter(j => j.source_document_id === result.id || j.source_stock_movement_id === result.id).map(j => j.id);
  const lines = data.lines.filter(l => journalIds.includes(l.journal_id));
  const items = doc ? data.items.filter(i => i.document_id === doc.id) : [];
  const party = doc?.party_id ? data.parties.find(p => p.id === doc.party_id) : undefined;
  const fields: [string, unknown][] = doc ? [["Number", doc.number], ["Status", doc.status], ["Party", party?.name ?? "—"], ["Date", doc.document_date], ["Due", doc.due_date], ["Subtotal", money(doc.subtotal)], ["VAT", money(doc.tax_amount)], ["Total", money(doc.total)], ["Notes", doc.notes || "—"]]
    : stock ? [["Item", stock.item], ["Type", stock.kind], ["Quantity", `${Number(stock.quantity)} ${stock.unit}`], ["Unit cost", money(stock.unit_cost)], ["Value", money(stock.value)], ["From bin", stock.from_bin || "—"], ["To bin", stock.to_bin || "—"], ["Reference", stock.reference || "—"], ["Reason", stock.reason || "—"], ["Date", stock.movement_date]]
    : result ? [["Description", result.label], ["Date", result.date]] : [];
  return <Dialog open={Boolean(result)} onOpenChange={o => !o && onClose()}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">{result && <>
    <DialogHeader><DialogTitle>{result.label}</DialogTitle><DialogDescription>{kindLabel[result.kind]} · {data.company.name}</DialogDescription></DialogHeader>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">{fields.map(([k, v]) => <div key={k} className="flex justify-between gap-3 border-b border-border py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="text-right capitalize">{String(v)}</dd></div>)}</dl>
    {items.length > 0 && <><h3 className="mt-4 text-sm font-semibold">Lines</h3><Table><TableBody>{items.map(i => <TableRow key={i.id}><TableCell>{i.description}</TableCell><TableCell className="tabular-nums">{Number(i.quantity)} {i.unit}</TableCell><TableCell className="text-right tabular-nums">{money(Number(i.net_amount) + Number(i.tax_amount))}</TableCell></TableRow>)}</TableBody></Table></>}
    {lines.length > 0 && <><h3 className="mt-4 text-sm font-semibold">Ledger entries</h3><Table><TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader><TableBody>{lines.map(l => <TableRow key={l.id}><TableCell>{account.get(l.account_id)}</TableCell><TableCell className="text-right tabular-nums">{Number(l.debit) ? money(l.debit) : ""}</TableCell><TableCell className="text-right tabular-nums">{Number(l.credit) ? money(l.credit) : ""}</TableCell></TableRow>)}</TableBody></Table></>}
    <div className="mt-4 flex justify-end"><Button asChild size="sm" variant="outline"><Link to="/kenya/$section" params={{ section: result.section }}>Open in {kindLabel[result.kind]} list</Link></Button></div>
  </>}</DialogContent></Dialog>;
}

function SelfTest({ companyId }: { companyId: string }) {
  const run = useMutation({ mutationFn: () => runKenyaSelfTest({ data: { company_id: companyId } }) });
  return <section className="mt-10 border-t border-border pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Ledger integrity check</h2><p className="mt-1 text-xs text-muted-foreground">Runs a test invoice, payment, credit note, refund, expense and stock movement, checks the books balance and stay Kenya-only, then discards everything.</p></div><Button size="sm" variant="outline" onClick={() => run.mutate()} disabled={run.isPending}><ShieldCheck className="mr-2 h-4 w-4" />{run.isPending ? "Checking…" : "Run check"}</Button></div>
    {run.data && <p role="status" className={`mt-3 text-sm ${run.data.passed ? "text-primary" : "text-destructive"}`}>{run.data.passed ? "Passed" : "Failed"}: {run.data.message.replace(/^(PASS|FAIL): /, "")}</p>}
    {run.error && <p role="alert" className="mt-3 text-sm text-destructive">{run.error.message}</p>}</section>;
}
