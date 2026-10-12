import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { createKenyaSalesOrder, createKenyaExpense, createKenyaInvoice, createKenyaPurchaseOrder, creditKenyaInvoice, postKenyaInvoice, receiveKenyaPurchaseOrder, recordKenyaPayment, recordKenyaStock } from "@/lib/kenya-erp.functions";
import type { KenyaData } from "@/lib/kenya-erp";
import { formatMoney } from "@/lib/location";
import { downloadDocumentPdf } from "@/lib/kenya-pdf";

const ksh = (n: number) => formatMoney(n, "KES");
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (date: string, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
const canWrite = (role: string) => ["owner", "accountant", "manager"].includes(role);

function useRefresh() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["kenya-erp"] }); }

export function stockLevels(data: KenyaData) {
  const map = new Map<string, { item: string; unit: string; qty: number; value: number }>();
  for (const m of data.stock) {
    if (m.kind === "transfer") continue;
    const key = m.item.toLowerCase();
    const row = map.get(key) ?? { item: m.item, unit: m.unit, qty: 0, value: 0 };
    row.qty += Number(m.quantity); row.value += Number(m.value); map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.item.localeCompare(b.item));
}

/* ---------------- Invoices ---------------- */

export function Invoices({ data }: { data: KenyaData }) {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const invoices = data.documents.filter(d => d.kind === "invoice");
  const credited = (id: string) => data.documents.find(d => d.kind === "credit_note" && d.original_document_id === id);
  const party = (id: string | null) => data.parties.find(p => p.id === id)?.name ?? "—";
  const paid = (id: string) => data.payments.filter(p => p.document_id === id).reduce((s, p) => s + Number(p.amount), 0);
  const selected = invoices.find(i => i.id === open);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold">Customer invoices · KSh</h2>
      {canWrite(data.role) && <Button size="sm" onClick={() => setCreating(true)} disabled={data.accounts.length === 0}><Plus className="mr-1.5 h-4 w-4" />New invoice</Button>}
    </div>
    {data.accounts.length === 0 && <p className="mb-4 text-sm text-muted-foreground">Initialize the chart of accounts before invoicing.</p>}
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
      <TableBody>{invoices.map(i => <TableRow key={i.id} className="cursor-pointer" onClick={() => setOpen(i.id)}><TableCell className="font-mono text-xs">{i.number}</TableCell><TableCell>{party(i.party_id)}</TableCell><TableCell>{i.document_date}</TableCell><TableCell>{i.due_date}</TableCell><TableCell className="capitalize">{credited(i.id) ? `Cancelled · ${credited(i.id)!.number}` : i.status === "posted" && paid(i.id) >= Number(i.total) ? "Paid" : i.status}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.total))}</TableCell><TableCell className="text-right tabular-nums">{ksh(i.status === "posted" && !credited(i.id) ? Number(i.total) - paid(i.id) : 0)}</TableCell></TableRow>)}</TableBody></Table>
      {invoices.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No invoices yet.</p>}
    </div>
    {selected && <InvoiceDetail data={data} invoice={selected} paid={paid(selected.id)} creditNote={credited(selected.id)} close={() => setOpen(null)} />}
    {creating && <InvoiceEditor data={data} close={() => setCreating(false)} />}
  </>;
}

function InvoiceDetail({ data, invoice, paid, close, creditNote }: { data: KenyaData; invoice: KenyaData["documents"][number]; paid: number; close: () => void; creditNote?: KenyaData["documents"][number] }) {
  const credit = useServerFn(creditKenyaInvoice);
  const [reason, setReason] = useState("");
  const refresh = useRefresh();
  const post = useServerFn(postKenyaInvoice);
  const pay = useServerFn(recordKenyaPayment);
  const payAccounts = data.accounts.filter(a => ["1000", "1010", "1020"].includes(a.code));
  const balance = Math.round((Number(invoice.total) - paid) * 100) / 100;
  const [form, setForm] = useState({ account: payAccounts[0]?.id ?? "", amount: String(balance), reference: "", date: today() });
  const posting = useMutation({ mutationFn: () => post({ data: { document_id: invoice.id } }), onSuccess: refresh });
  const crediting = useMutation({ mutationFn: () => credit({ data: { document_id: invoice.id, reason, date: today() } }), onSuccess: refresh });
  const paying = useMutation({ mutationFn: () => pay({ data: { document_id: invoice.id, account_id: form.account, amount: Number(form.amount), date: form.date, reference: form.reference } }), onSuccess: () => { setForm(f => ({ ...f, reference: "" })); refresh(); } });
  const items = data.items.filter(i => i.document_id === invoice.id);
  const customer = data.parties.find(p => p.id === invoice.party_id);
  const writable = canWrite(data.role);
  return <section className="mt-7 border-t border-border pt-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{invoice.number}</h2><p className="text-xs text-muted-foreground">{customer?.name} {customer?.kra_pin ? `· KRA PIN ${customer.kra_pin}` : ""}</p></div>
      <div className="flex gap-2">{invoice.status === "draft" && writable && <Button size="sm" onClick={() => posting.mutate()} disabled={posting.isPending}>{posting.isPending ? "Posting…" : "Post to ledger"}</Button>}<Button size="sm" variant="outline" onClick={() => downloadDocumentPdf(data, invoice, paid)}>Download PDF</Button>{creditNote && <Button size="sm" variant="outline" onClick={() => downloadDocumentPdf(data, creditNote, 0)}>Credit note PDF</Button>}<Button size="sm" variant="ghost" onClick={close}>Close</Button></div></div>
    {posting.error && <p role="alert" className="mb-3 text-sm text-destructive">{posting.error.message}</p>}
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Stock item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Net</TableHead><TableHead className="text-right">VAT</TableHead></TableRow></TableHeader>
      <TableBody>{items.map(i => <TableRow key={i.id}><TableCell>{i.description}</TableCell><TableCell>{i.stock_item || "—"}</TableCell><TableCell className="text-right tabular-nums">{Number(i.quantity)} {i.unit}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.unit_price))}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.net_amount))}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.tax_amount))}</TableCell></TableRow>)}</TableBody></Table></div>
    <dl className="ml-auto mt-4 max-w-xs space-y-2 text-sm">{[["Subtotal", invoice.subtotal], ["VAT", invoice.tax_amount], ["Total", invoice.total], ["Paid", paid], ["Balance due", invoice.status === "posted" && !creditNote ? balance : 0]].map(([l, v]) => <div key={String(l)} className="flex justify-between"><dt className="text-muted-foreground">{l}</dt><dd className="font-medium tabular-nums">{ksh(Number(v))}</dd></div>)}</dl>
    {creditNote && <p className="mt-6 border-t border-border pt-4 text-sm">Cancelled by credit note <span className="font-mono">{creditNote.number}</span> on {creditNote.document_date} — {creditNote.notes}. Ledger and stock were reversed.</p>}
    {invoice.kind === "invoice" && invoice.status === "posted" && !creditNote && paid === 0 && writable && <form className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-4" onSubmit={e => { e.preventDefault(); crediting.mutate(); }}>
      <div className="min-w-60 flex-1"><Label className="text-xs">Credit note reason</Label><Input required aria-label="Credit note reason" placeholder="Why is this invoice being cancelled?" value={reason} onChange={e => setReason(e.target.value)} /></div>
      <Button type="submit" size="sm" variant="outline" disabled={crediting.isPending}>{crediting.isPending ? "Issuing…" : "Issue credit note"}</Button>
      {crediting.error && <p role="alert" className="w-full text-sm text-destructive">{crediting.error.message}</p>}
    </form>}
    {invoice.status === "posted" && !creditNote && balance > 0 && writable && <form className="mt-6 grid gap-3 border-t border-border pt-4 sm:grid-cols-5" onSubmit={e => { e.preventDefault(); paying.mutate(); }}>
      <div><Label className="text-xs">{invoice.kind === "bill" ? "Paid from" : "Received into"}</Label><select aria-label="Payment account" className={selectCls} value={form.account} onChange={e => setForm({ ...form, account: e.target.value })}>{payAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div><Label className="text-xs">Amount (KSh)</Label><Input type="number" step="0.01" min="0.01" max={balance} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
      <div><Label className="text-xs">Reference</Label><Input required placeholder="M-Pesa code / cheque" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
      <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
      <div className="flex items-end"><Button type="submit" size="sm" className="w-full" disabled={paying.isPending}>{paying.isPending ? "Saving…" : "Record payment"}</Button></div>
      {paying.error && <p role="alert" className="text-sm text-destructive sm:col-span-5">{paying.error.message}</p>}
    </form>}
  </section>;
}

type Line = { description: string; stock_item: string; quantity: string; unit: string; unit_price: string; discount: string; tax_code_id: string };

export function InvoiceEditor({ data, close, purchase = false, mode = purchase ? "purchase" : "invoice" }: { data: KenyaData; close: () => void; purchase?: boolean; mode?: "invoice" | "purchase" | "sales_order" | "expense" }) {
  purchase = mode === "purchase" || mode === "expense";
  const createSo = useServerFn(createKenyaSalesOrder);
  const createExp = useServerFn(createKenyaExpense);
  const [reference, setReference] = useState("");
  const refresh = useRefresh();
  const createInvoice = useServerFn(createKenyaInvoice);
  const createPo = useServerFn(createKenyaPurchaseOrder);
  const create = mode === "purchase" ? createPo : mode === "sales_order" ? createSo : createInvoice;
  const customers = data.parties.filter(p => p.kind === (purchase ? "supplier" : "customer") && !p.archived);
  const defaultTax = data.taxes.find(t => t.treatment === "standard")?.id ?? data.taxes[0]?.id ?? "";
  const blank = (): Line => ({ description: "", stock_item: "", quantity: "1", unit: "Sqm", unit_price: "0", discount: "0", tax_code_id: defaultTax });
  const [partyId, setPartyId] = useState(mode === "expense" ? "" : customers[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const terms = customers.find(c => c.id === partyId)?.payment_terms ?? 30;
  const [due, setDue] = useState(addDays(today(), terms));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([blank()]);
  const levels = useMemo(() => stockLevels(data), [data]);
  const totals = lines.reduce((acc, l) => { const net = Math.max(0, Number(l.quantity) * Number(l.unit_price) - Number(l.discount)); const rate = Number(data.taxes.find(t => t.id === l.tax_code_id)?.rate ?? 0); return { net: acc.net + net, tax: acc.tax + Math.round(net * rate) / 100 }; }, { net: 0, tax: 0 });
  const save = useMutation({
    mutationFn: () => { const items = lines.map(l => ({ description: l.description, stock_item: l.stock_item, quantity: Number(l.quantity), unit: l.unit, unit_price: Number(l.unit_price), discount: Number(l.discount), tax_code_id: l.tax_code_id })); return mode === "expense" ? createExp({ data: { company_id: data.company.id, party_id: partyId || null, date, reference, notes, items } }) : create({ data: { company_id: data.company.id, party_id: partyId, date, due, notes, items } }); },
    onSuccess: () => { refresh(); close(); },
  });
  const set = (i: number, patch: Partial<Line>) => setLines(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l));
  return <Dialog open onOpenChange={o => !o && close()}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
    <DialogHeader><DialogTitle>{({ invoice: "New sales invoice", purchase: "New purchase order", sales_order: "New sales order", expense: "New expense" })[mode]} (KSh)</DialogTitle></DialogHeader>
    {customers.length === 0 && mode !== "expense" ? <p className="text-sm text-muted-foreground">{purchase ? "Add a supplier first." : "Add a customer first."}</p> : <form id="invoice-form" className="space-y-4" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><Label className="text-xs">{purchase ? "Supplier" : "Customer"}</Label><select aria-label={purchase ? "Supplier" : "Customer"} className={selectCls} value={partyId} onChange={e => { setPartyId(e.target.value); setDue(addDays(date, customers.find(c => c.id === e.target.value)?.payment_terms ?? 30)); }}>{mode === "expense" && <option value="">No supplier</option>}{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><Label className="text-xs">{purchase ? "Order date" : "Invoice date"}</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        {mode === "expense" ? <div><Label className="text-xs">Receipt / reference</Label><Input aria-label="Expense reference" value={reference} onChange={e => setReference(e.target.value)} /></div> : <div><Label className="text-xs">{mode === "invoice" ? "Due date" : "Expected delivery"}</Label><Input type="date" value={due} onChange={e => setDue(e.target.value)} /></div>}
      </div>
      <datalist id="kenya-stock-items">{levels.map(l => <option key={l.item} value={l.item}>{`${l.qty} ${l.unit} available`}</option>)}</datalist>
      <div className="space-y-2">{lines.map((l, i) => <div key={i} className="grid gap-2 border-b border-border pb-2 sm:grid-cols-[2fr_1.5fr_0.7fr_0.6fr_1fr_0.8fr_1fr_auto]">
        <Input aria-label="Description" required placeholder="Description" value={l.description} onChange={e => set(i, { description: e.target.value })} />
        <Input aria-label="Stock item" list="kenya-stock-items" placeholder="Stock item (optional)" value={l.stock_item} onChange={e => set(i, { stock_item: e.target.value })} />
        <Input aria-label="Quantity" type="number" step="0.001" min="0.001" value={l.quantity} onChange={e => set(i, { quantity: e.target.value })} />
        <Input aria-label="Unit" value={l.unit} onChange={e => set(i, { unit: e.target.value })} />
        <Input aria-label="Unit price" type="number" step="0.01" min="0" value={l.unit_price} onChange={e => set(i, { unit_price: e.target.value })} />
        <Input aria-label="Discount" type="number" step="0.01" min="0" value={l.discount} onChange={e => set(i, { discount: e.target.value })} />
        <select aria-label="Tax code" className={selectCls} value={l.tax_code_id} onChange={e => set(i, { tax_code_id: e.target.value })}>{data.taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <Button type="button" variant="ghost" size="icon" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
      </div>)}</div>
      <Button type="button" variant="outline" size="sm" onClick={() => setLines(ls => [...ls, blank()])}><Plus className="mr-1 h-4 w-4" />Add line</Button>
      <Input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="ml-auto max-w-xs space-y-1 text-sm">{[["Subtotal", totals.net], ["VAT", totals.tax], ["Total", totals.net + totals.tax]].map(([l, v]) => <div key={String(l)} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="tabular-nums">{ksh(Number(v))}</span></div>)}</div>
      {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
    </form>}
    <DialogFooter><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" form="invoice-form" disabled={save.isPending || customers.length === 0}>{save.isPending ? "Saving…" : "Save draft"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Stock ---------------- */

export function StockMovements({ data }: { data: KenyaData }) {
  const [kind, setKind] = useState<"receipt" | "transfer" | "adjustment" | null>(null);
  const levels = stockLevels(data);
  const labels = { receipt: "Received", transfer: "Transfer", adjustment: "Adjustment", sale: "Sold" } as Record<string, string>;
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Kenya warehouse stock</h2>
      {canWrite(data.role) && <div className="flex flex-wrap gap-2">{(["receipt", "transfer", "adjustment"] as const).map(k => <Button key={k} size="sm" variant={k === "receipt" ? "default" : "outline"} disabled={data.accounts.length === 0} onClick={() => setKind(k)}>{k === "receipt" ? "Receive stock" : k === "transfer" ? "Transfer bins" : "Adjust stock"}</Button>)}</div>}</div>
    {data.accounts.length === 0 && <p className="mb-4 text-sm text-muted-foreground">Initialize the chart of accounts before recording stock.</p>}
    <div className="mb-8 overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">On hand</TableHead><TableHead className="text-right">Avg cost</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
      <TableBody>{levels.map(l => <TableRow key={l.item}><TableCell>{l.item}</TableCell><TableCell className="text-right tabular-nums">{l.qty} {l.unit}</TableCell><TableCell className="text-right tabular-nums">{ksh(l.qty > 0 ? l.value / l.qty : 0)}</TableCell><TableCell className="text-right tabular-nums">{ksh(l.value)}</TableCell></TableRow>)}</TableBody></Table>
      {levels.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No stock received yet.</p>}</div>
    <h3 className="mb-3 text-sm font-semibold">Movement history</h3>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Bins</TableHead><TableHead>Reference / reason</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
      <TableBody>{data.stock.map(m => <TableRow key={m.id}><TableCell>{m.movement_date}</TableCell><TableCell>{labels[m.kind]}</TableCell><TableCell>{m.item}</TableCell><TableCell className="text-right tabular-nums">{Number(m.quantity)} {m.unit}</TableCell><TableCell className="text-xs">{m.from_bin || m.to_bin ? `${m.from_bin ?? "—"} → ${m.to_bin ?? "—"}` : "—"}</TableCell><TableCell className="text-xs">{[m.reference, m.reason].filter(Boolean).join(" · ") || "—"}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(m.value))}</TableCell></TableRow>)}</TableBody></Table>
      {data.stock.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No stock movements recorded.</p>}</div>
    {kind && <StockDialog data={data} kind={kind} levels={levels} close={() => setKind(null)} />}
  </>;
}

function StockDialog({ data, kind, levels, close }: { data: KenyaData; kind: "receipt" | "transfer" | "adjustment"; levels: ReturnType<typeof stockLevels>; close: () => void }) {
  const refresh = useRefresh();
  const record = useServerFn(recordKenyaStock);
  const [f, setF] = useState({ item: "", unit: "Sqm", quantity: "", unit_cost: "0", from_bin: "", to_bin: "", reference: "", reason: "", date: today() });
  const save = useMutation({ mutationFn: () => record({ data: { company_id: data.company.id, kind, item: f.item, unit: f.unit, quantity: Number(f.quantity), unit_cost: Number(f.unit_cost), from_bin: f.from_bin, to_bin: f.to_bin, reference: f.reference, reason: f.reason, date: f.date } }), onSuccess: () => { refresh(); close(); } });
  const field = (key: keyof typeof f, label: string, props: React.ComponentProps<typeof Input> = {}) => <div><Label className="text-xs">{label}</Label><Input aria-label={label} value={f[key]} onChange={e => setF({ ...f, [key]: e.target.value })} {...props} /></div>;
  const title = kind === "receipt" ? "Receive stock into Kenya warehouse" : kind === "transfer" ? "Transfer between bins" : "Stock adjustment";
  return <Dialog open onOpenChange={o => !o && close()}><DialogContent>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <form id="stock-form" className="grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
      <datalist id="kenya-stock-list">{levels.map(l => <option key={l.item} value={l.item}>{`${l.qty} ${l.unit} on hand`}</option>)}</datalist>
      <div className="sm:col-span-2">{field("item", "Stock item", { required: true, list: "kenya-stock-list", placeholder: "e.g. Calacatta Gold 20mm" })}</div>
      {field("quantity", kind === "adjustment" ? "Quantity (+ / −)" : "Quantity", { required: true, type: "number", step: "0.001" })}
      {field("unit", "Unit", { required: true })}
      {kind !== "transfer" && field("unit_cost", kind === "receipt" ? "Unit cost (KSh)" : "Unit cost if no stock yet (KSh)", { type: "number", step: "0.01", min: "0" })}
      {kind === "transfer" && <>{field("from_bin", "From bin", { required: true })}{field("to_bin", "To bin", { required: true })}</>}
      {kind === "receipt" && field("to_bin", "Bin location")}
      {field("reference", kind === "receipt" ? "Supplier delivery note" : "Reference")}
      {kind === "adjustment" && <div className="sm:col-span-2">{field("reason", "Reason", { required: true, placeholder: "Breakage, count correction…" })}</div>}
      {field("date", "Date", { type: "date" })}
      <p className="text-xs text-muted-foreground sm:col-span-2">{kind === "receipt" ? "Posts Inventory (debit) and Accounts Payable (credit) in KSh." : kind === "adjustment" ? "Posts the value difference between Inventory and Cost of Goods Sold at average cost." : "Moves stock between bins; no ledger impact."}</p>
      {save.error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{save.error.message}</p>}
    </form>
    <DialogFooter><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" form="stock-form" disabled={save.isPending}>{save.isPending ? "Recording…" : "Record"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

/* ---------------- Purchasing ---------------- */

export function PurchaseOrders({ data }: { data: KenyaData }) {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const pos = data.documents.filter(d => d.kind === "purchase_order");
  const party = (id: string | null) => data.parties.find(p => p.id === id)?.name ?? "—";
  const billFor = (id: string) => data.documents.find(d => d.kind === "bill" && d.original_document_id === id);
  const selected = pos.find(p => p.id === open);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Purchase orders · KSh</h2>
      {canWrite(data.role) && <Button size="sm" onClick={() => setCreating(true)} disabled={data.accounts.length === 0}><Plus className="mr-1.5 h-4 w-4" />New purchase order</Button>}</div>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Supplier</TableHead><TableHead>Date</TableHead><TableHead>Expected</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
      <TableBody>{pos.map(p => <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpen(p.id)}><TableCell className="font-mono text-xs">{p.number}</TableCell><TableCell>{party(p.party_id)}</TableCell><TableCell>{p.document_date}</TableCell><TableCell>{p.due_date}</TableCell><TableCell>{billFor(p.id) ? `Received · ${billFor(p.id)!.number}` : "Open"}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(p.total))}</TableCell></TableRow>)}</TableBody></Table>
      {pos.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No purchase orders yet.</p>}</div>
    {selected && <PoDetail data={data} po={selected} close={() => setOpen(null)} />}
    {creating && <InvoiceEditor purchase data={data} close={() => setCreating(false)} />}
  </>;
}

function PoDetail({ data, po, close }: { data: KenyaData; po: KenyaData["documents"][number]; close: () => void }) {
  const refresh = useRefresh();
  const receive = useServerFn(receiveKenyaPurchaseOrder);
  const [f, setF] = useState({ ref: "", bin: "", date: today() });
  const receiving = useMutation({ mutationFn: () => receive({ data: { document_id: po.id, supplier_ref: f.ref, bin: f.bin, date: f.date } }), onSuccess: refresh });
  const items = data.items.filter(i => i.document_id === po.id);
  return <section className="mt-7 border-t border-border pt-5">
    <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{po.number}</h2><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => downloadDocumentPdf(data, po, 0)}>Download PDF</Button><Button size="sm" variant="ghost" onClick={close}>Close</Button></div></div>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Stock item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Net</TableHead><TableHead className="text-right">VAT</TableHead></TableRow></TableHeader>
      <TableBody>{items.map(i => <TableRow key={i.id}><TableCell>{i.description}</TableCell><TableCell>{i.stock_item || "—"}</TableCell><TableCell className="text-right tabular-nums">{Number(i.quantity)} {i.unit}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.unit_price))}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.net_amount))}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(i.tax_amount))}</TableCell></TableRow>)}</TableBody></Table></div>
    <p className="mt-3 text-right text-sm font-medium tabular-nums">Total {ksh(Number(po.total))}</p>
    {po.status === "draft" && canWrite(data.role) && <form className="mt-6 grid gap-3 border-t border-border pt-4 sm:grid-cols-4" onSubmit={e => { e.preventDefault(); receiving.mutate(); }}>
      <div><Label className="text-xs">Supplier invoice no.</Label><Input required aria-label="Supplier invoice number" value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })} /></div>
      <div><Label className="text-xs">Receive into bin</Label><Input aria-label="Receiving bin" value={f.bin} onChange={e => setF({ ...f, bin: e.target.value })} /></div>
      <div><Label className="text-xs">Received on</Label><Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
      <div className="flex items-end"><Button type="submit" size="sm" className="w-full" disabled={receiving.isPending}>{receiving.isPending ? "Receiving…" : "Receive & create bill"}</Button></div>
      <p className="text-xs text-muted-foreground sm:col-span-4">Adds stock lines to the Kenya warehouse and posts a supplier bill: Inventory + Input VAT (debit), Accounts Payable (credit).</p>
      {receiving.error && <p role="alert" className="text-sm text-destructive sm:col-span-4">{receiving.error.message}</p>}
    </form>}
  </section>;
}

export function SupplierBills({ data }: { data: KenyaData }) {
  const [open, setOpen] = useState<string | null>(null);
  const bills = data.documents.filter(d => d.kind === "bill");
  const party = (id: string | null) => data.parties.find(p => p.id === id)?.name ?? "—";
  const paid = (id: string) => data.payments.filter(p => p.document_id === id).reduce((s, p) => s + Number(p.amount), 0);
  const selected = bills.find(b => b.id === open);
  return <>
    <h2 className="mb-5 text-sm font-semibold">Supplier bills · KSh</h2>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Supplier</TableHead><TableHead>Supplier ref</TableHead><TableHead>Due</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
      <TableBody>{bills.map(b => <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpen(b.id)}><TableCell className="font-mono text-xs">{b.number}</TableCell><TableCell>{party(b.party_id)}</TableCell><TableCell>{b.supplier_reference ?? "—"}</TableCell><TableCell>{b.due_date}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(b.total))}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(b.total) - paid(b.id))}</TableCell></TableRow>)}</TableBody></Table>
      {bills.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No supplier bills yet. Receive a purchase order to create one.</p>}</div>
    {selected && <InvoiceDetail data={data} invoice={selected} paid={paid(selected.id)} close={() => setOpen(null)} />}
  </>;
}
