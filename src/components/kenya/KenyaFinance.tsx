import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Download, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { KenyaData } from "@/lib/kenya-erp";
import { formatMoney } from "@/lib/location";
import { InvoiceEditor } from "./KenyaOperations";
import { convertKenyaSalesOrder, decideKenyaApproval, logKenyaCommunication, postKenyaExpense, refundKenyaCustomer, requestKenyaApproval, saveKenyaControls, saveKenyaTaxCode, validateKenyaEtims } from "@/lib/kenya-erp.functions";

type Doc = KenyaData["documents"][number];
const ksh = (n: number) => formatMoney(n, "KES");
const today = () => new Date().toISOString().slice(0, 10);
const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
const canWrite = (role: string) => ["owner", "accountant", "manager"].includes(role);
const useRefresh = () => { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ["kenya-erp"] }); };
const Err = ({ e }: { e: Error | null }) => e ? <p role="alert" className="text-sm text-destructive">{e.message}</p> : null;

// ---------- CSV ----------
export function downloadCsv(name: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [header, ...rows].map(r => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
const partyName = (data: KenyaData, id: string | null) => data.parties.find(p => p.id === id)?.name ?? "";
export function exportInvoicesCsv(data: KenyaData) {
  const paid = (id: string) => data.payments.filter(p => p.document_id === id).reduce((s, p) => s + Number(p.amount), 0);
  downloadCsv(`kenya-invoices-${today()}.csv`, ["Number", "Customer", "Date", "Due", "Status", "Approval", "Subtotal KES", "VAT KES", "Total KES", "Paid KES"],
    data.documents.filter(d => d.kind === "invoice").map(d => [d.number, partyName(data, d.party_id), d.document_date, d.due_date, d.status, d.approval_status, d.subtotal, d.tax_amount, d.total, paid(d.id)]));
}
export function exportStockCsv(data: KenyaData) {
  downloadCsv(`kenya-stock-movements-${today()}.csv`, ["Date", "Kind", "Item", "Quantity", "Unit", "Unit cost KES", "Value KES", "From bin", "To bin", "Reference", "Reason"],
    data.stock.map(m => [m.movement_date, m.kind, m.item, m.quantity, m.unit, m.unit_cost, m.value, m.from_bin, m.to_bin, m.reference, m.reason]));
}
export function exportLedgerCsv(data: KenyaData) {
  const j = new Map(data.journals.map(x => [x.id, x])); const a = new Map(data.accounts.map(x => [x.id, x]));
  const rows = data.lines.map(l => { const jj = j.get(l.journal_id); const aa = a.get(l.account_id); return [jj?.journal_date, jj?.description, aa?.code, aa?.name, l.debit, l.credit, l.journal_id]; }).sort((x, y) => String(x[0]).localeCompare(String(y[0])));
  downloadCsv(`kenya-ledger-${today()}.csv`, ["Date", "Journal", "Account code", "Account", "Debit KES", "Credit KES", "Journal ID"], rows);
}
export const CsvButton = ({ onClick, label = "Export CSV" }: { onClick: () => void; label?: string }) => <Button size="sm" variant="outline" onClick={onClick}><Download className="mr-1.5 h-4 w-4" />{label}</Button>;

// ---------- Approval ----------
function ApprovalControls({ data, doc }: { data: KenyaData; doc: Doc }) {
  const refresh = useRefresh(); const request = useServerFn(requestKenyaApproval); const decide = useServerFn(decideKenyaApproval);
  const [note, setNote] = useState("");
  const req = useMutation({ mutationFn: () => request({ data: { document_id: doc.id } }), onSuccess: refresh });
  const dec = useMutation({ mutationFn: (approve: boolean) => decide({ data: { document_id: doc.id, approve, note } }), onSuccess: refresh });
  const threshold = Number(data.company.approval_threshold);
  if (doc.status !== "draft") return doc.approval_status !== "not_required" ? <p className="text-xs text-muted-foreground">Approval: {doc.approval_status}{doc.approval_note ? ` — ${doc.approval_note}` : ""}</p> : null;
  const needed = threshold > 0 && Number(doc.total) >= threshold;
  const approver = ["owner", "manager"].includes(data.role);
  return <div className="space-y-2 border-t border-border pt-4 text-sm">
    <p><span className="text-muted-foreground">Approval:</span> <span className="capitalize">{doc.approval_status.replace("_", " ")}</span>{needed && doc.approval_status !== "approved" && <span className="text-muted-foreground"> · required before posting (threshold {ksh(threshold)})</span>}{doc.approval_note && ` — ${doc.approval_note}`}</p>
    <div className="flex flex-wrap gap-2">
      {canWrite(data.role) && ["not_required", "rejected"].includes(doc.approval_status) && <Button size="sm" variant="outline" onClick={() => req.mutate()} disabled={req.isPending}>Request approval</Button>}
      {approver && doc.approval_status === "pending" && <><Input className="h-9 w-56" placeholder="Note (required to reject)" value={note} onChange={e => setNote(e.target.value)} /><Button size="sm" onClick={() => dec.mutate(true)} disabled={dec.isPending}>Approve</Button><Button size="sm" variant="outline" onClick={() => dec.mutate(false)} disabled={dec.isPending}>Reject</Button></>}
    </div><Err e={req.error ?? dec.error} />
  </div>;
}

// ---------- Invoice add-ons: send, eTIMS, refund, approvals ----------
export function InvoiceExtras({ data, invoice, creditNote, paid }: { data: KenyaData; invoice: Doc; creditNote?: Doc; paid: number }) {
  return <div className="mt-6 space-y-5">
    <ApprovalControls data={data} doc={invoice} />
    {invoice.status === "posted" && <SendInvoice data={data} invoice={invoice} paid={paid} />}
    {invoice.status === "posted" && <EtimsPanel data={data} doc={invoice} />}
    {creditNote && paid > 0 && <RefundPanel data={data} creditNote={creditNote} paid={paid} />}
  </div>;
}

function SendInvoice({ data, invoice, paid }: { data: KenyaData; invoice: Doc; paid: number }) {
  const refresh = useRefresh(); const log = useServerFn(logKenyaCommunication);
  const customer = data.parties.find(p => p.id === invoice.party_id);
  const [email, setEmail] = useState(customer?.email ?? ""); const [phone, setPhone] = useState(customer?.whatsapp || customer?.phone || "");
  const msg = `Dear ${customer?.name ?? "customer"}, please find invoice ${invoice.number} from ${data.company.name} for ${ksh(Number(invoice.total))}, balance due ${ksh(Number(invoice.total) - paid)} by ${invoice.due_date}.${data.company.mpesa_details ? ` M-Pesa: ${data.company.mpesa_details}.` : ""}${data.company.bank_details ? ` Bank: ${data.company.bank_details}.` : ""} The PDF is attached.`;
  const record = useMutation({ mutationFn: (v: { channel: "email" | "whatsapp"; recipient: string; status: "opened_in_app" | "confirmed_sent" | "failed" }) => log({ data: { document_id: invoice.id, ...v, note: "" } }), onSuccess: refresh });
  const open = (channel: "email" | "whatsapp") => {
    const recipient = channel === "email" ? email.trim() : phone.replace(/[^\d]/g, "").replace(/^0/, "254");
    if (recipient.length < 3) return;
    window.open(channel === "email" ? `mailto:${recipient}?subject=${encodeURIComponent(`Invoice ${invoice.number}`)}&body=${encodeURIComponent(msg)}` : `https://wa.me/${recipient}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    record.mutate({ channel, recipient, status: "opened_in_app" });
  };
  const history = data.comms.filter(c => c.document_id === invoice.id);
  const label = { opened_in_app: "Opened in app — not confirmed", confirmed_sent: "Confirmed sent", failed: "Failed" } as const;
  return <section className="border-t border-border pt-4">
    <h3 className="mb-3 text-sm font-semibold">Send to customer</h3>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex gap-2"><Input aria-label="Customer email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><Button size="sm" variant="outline" onClick={() => open("email")}><Mail className="mr-1.5 h-4 w-4" />Email</Button></div>
      <div className="flex gap-2"><Input aria-label="WhatsApp number" placeholder="WhatsApp e.g. 0712 345678" value={phone} onChange={e => setPhone(e.target.value)} /><Button size="sm" variant="outline" onClick={() => open("whatsapp")}><MessageCircle className="mr-1.5 h-4 w-4" />WhatsApp</Button></div>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Opens your email app or WhatsApp with the message ready; attach the downloaded PDF. Mark it sent once you've sent it — no delivery provider is connected yet.</p>
    <Err e={record.error} />
    {history.length > 0 && <ul className="mt-3 space-y-1 text-xs">{history.map(c => <li key={c.id} className="flex flex-wrap items-center gap-2"><span className="capitalize">{c.channel}</span><span className="text-muted-foreground">{c.recipient} · {new Date(c.created_at).toLocaleString("en-KE")}</span><span className="font-medium">{label[c.status as keyof typeof label]}</span>
      {c.status === "opened_in_app" && history.every(h => h.created_at <= c.created_at || h.recipient !== c.recipient || h.status === "opened_in_app") && <><Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => record.mutate({ channel: c.channel as "email", recipient: c.recipient, status: "confirmed_sent" })}>Mark sent</Button><Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => record.mutate({ channel: c.channel as "email", recipient: c.recipient, status: "failed" })}>Mark failed</Button></>}</li>)}</ul>}
  </section>;
}

function EtimsPanel({ data, doc }: { data: KenyaData; doc: Doc }) {
  const refresh = useRefresh(); const validate = useServerFn(validateKenyaEtims);
  const run = useMutation({ mutationFn: () => validate({ data: { document_id: doc.id } }), onSuccess: refresh });
  const subs = data.etims.filter(s => s.document_id === doc.id);
  if (data.company.etims_mode !== "test") return <p className="border-t border-border pt-4 text-xs text-muted-foreground">KRA eTIMS: disabled. Turn on test mode in Tax / eTIMS settings to validate invoices.</p>;
  return <section className="border-t border-border pt-4">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">KRA eTIMS · <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">TEST MODE</span></h3>{canWrite(data.role) && <Button size="sm" variant="outline" onClick={() => run.mutate()} disabled={run.isPending}><ShieldCheck className="mr-1.5 h-4 w-4" />{run.isPending ? "Validating…" : "Validate (test)"}</Button>}</div>
    <p className="text-xs text-muted-foreground">Checks PINs, VAT and totals locally. Nothing is sent to KRA; this is not a KRA-certified submission.</p>
    <Err e={run.error} />
    {subs.length > 0 && <ul className="mt-2 space-y-1 text-xs">{subs.map(s => <li key={s.id}><span className={s.status === "test_passed" ? "font-medium text-success" : "font-medium text-destructive"}>{s.status === "test_passed" ? "Test passed" : "Test failed"}</span> <span className="text-muted-foreground">{new Date(s.created_at).toLocaleString("en-KE")}</span>{s.errors.length > 0 && <span> — {s.errors.join("; ")}</span>}</li>)}</ul>}
  </section>;
}

function RefundPanel({ data, creditNote, paid }: { data: KenyaData; creditNote: Doc; paid: number }) {
  const refresh = useRefresh(); const refund = useServerFn(refundKenyaCustomer);
  const accts = data.accounts.filter(a => ["1000", "1010", "1020"].includes(a.code));
  const refunds = data.documents.filter(d => d.kind === "refund" && d.original_document_id === creditNote.id);
  const available = Math.round((Math.min(paid, Number(creditNote.total)) - refunds.reduce((s, r) => s + Number(r.total), 0)) * 100) / 100;
  const [f, setF] = useState({ account: accts[0]?.id ?? "", amount: String(available), reference: "", date: today() });
  const m = useMutation({ mutationFn: () => refund({ data: { document_id: creditNote.id, account_id: f.account, amount: Number(f.amount), date: f.date, reference: f.reference } }), onSuccess: () => { setF(x => ({ ...x, reference: "" })); refresh(); } });
  return <section className="border-t border-border pt-4">
    <h3 className="mb-2 text-sm font-semibold">Customer refund</h3>
    {refunds.map(r => <p key={r.id} className="text-xs text-muted-foreground"><span className="font-mono">{r.number}</span> · {r.document_date} · {ksh(Number(r.total))} · ref {r.supplier_reference}</p>)}
    {available > 0 && canWrite(data.role) ? <form className="mt-2 grid gap-2 sm:grid-cols-5" onSubmit={e => { e.preventDefault(); m.mutate(); }}>
      <select aria-label="Refund from" className={selectCls} value={f.account} onChange={e => setF({ ...f, account: e.target.value })}>{accts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <Input aria-label="Refund amount" type="number" step="0.01" min="0.01" max={available} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
      <Input aria-label="Refund reference" required placeholder="Reference" value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} />
      <Input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
      <Button type="submit" size="sm" disabled={m.isPending}>{m.isPending ? "Refunding…" : `Refund (max ${ksh(available)})`}</Button>
    </form> : <p className="text-xs text-muted-foreground">Fully refunded.</p>}
    <p className="mt-1 text-xs text-muted-foreground">Posts Accounts Receivable (debit), Cash/Bank/M-Pesa (credit).</p><Err e={m.error} />
  </section>;
}

// ---------- Sales orders ----------
export function SalesOrders({ data }: { data: KenyaData }) {
  const refresh = useRefresh(); const convert = useServerFn(convertKenyaSalesOrder);
  const [creating, setCreating] = useState(false);
  const conv = useMutation({ mutationFn: (id: string) => convert({ data: { document_id: id, date: today() } }), onSuccess: refresh });
  const orders = data.documents.filter(d => d.kind === "sales_order");
  const invoiceFor = (id: string) => data.documents.find(d => d.kind === "invoice" && d.original_document_id === id);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Sales orders · KSh</h2>{canWrite(data.role) && <Button size="sm" onClick={() => setCreating(true)} disabled={data.accounts.length === 0}><Plus className="mr-1.5 h-4 w-4" />New sales order</Button>}</div>
    <p className="mb-4 text-xs text-muted-foreground">Orders don't touch the ledger. Converting creates a draft invoice that posts like any other.</p>
    <Err e={conv.error} />
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Delivery</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>{orders.map(o => <TableRow key={o.id}><TableCell className="font-mono text-xs">{o.number}</TableCell><TableCell>{partyName(data, o.party_id)}</TableCell><TableCell>{o.document_date}</TableCell><TableCell>{o.due_date}</TableCell><TableCell>{o.status === "posted" ? `Invoiced · ${invoiceFor(o.id)?.number ?? ""}` : "Open"}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(o.total))}</TableCell><TableCell className="text-right">{o.status === "draft" && canWrite(data.role) && <Button size="sm" variant="outline" disabled={conv.isPending} onClick={() => conv.mutate(o.id)}>Convert to invoice</Button>}</TableCell></TableRow>)}</TableBody></Table>
      {orders.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No sales orders yet.</p>}</div>
    {creating && <InvoiceEditor mode="sales_order" data={data} close={() => setCreating(false)} />}
  </>;
}

// ---------- Expenses ----------
export function Expenses({ data }: { data: KenyaData }) {
  const [creating, setCreating] = useState(false); const [open, setOpen] = useState<string | null>(null);
  const expenses = data.documents.filter(d => d.kind === "expense");
  const sel = expenses.find(e => e.id === open);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">Expenses · KSh</h2>{canWrite(data.role) && <Button size="sm" onClick={() => setCreating(true)} disabled={data.accounts.length === 0}><Plus className="mr-1.5 h-4 w-4" />New expense</Button>}</div>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Supplier</TableHead><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
      <TableBody>{expenses.map(e => <TableRow key={e.id} className="cursor-pointer" onClick={() => setOpen(e.id)}><TableCell className="font-mono text-xs">{e.number}</TableCell><TableCell>{partyName(data, e.party_id) || "—"}</TableCell><TableCell>{e.document_date}</TableCell><TableCell>{e.supplier_reference ?? "—"}</TableCell><TableCell className="capitalize">{e.status === "draft" && e.approval_status !== "not_required" ? `draft · ${e.approval_status}` : e.status}</TableCell><TableCell className="text-right tabular-nums">{ksh(Number(e.total))}</TableCell></TableRow>)}</TableBody></Table>
      {expenses.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No expenses yet.</p>}</div>
    {sel && <ExpenseDetail key={sel.id} data={data} doc={sel} close={() => setOpen(null)} />}
    {creating && <InvoiceEditor mode="expense" data={data} close={() => setCreating(false)} />}
  </>;
}
function ExpenseDetail({ data, doc, close }: { data: KenyaData; doc: Doc; close: () => void }) {
  const refresh = useRefresh(); const post = useServerFn(postKenyaExpense);
  const accts = data.accounts.filter(a => ["1000", "1010", "1020"].includes(a.code));
  const [acct, setAcct] = useState(accts[0]?.id ?? "");
  const m = useMutation({ mutationFn: () => post({ data: { document_id: doc.id, account_id: acct } }), onSuccess: refresh });
  const items = data.items.filter(i => i.document_id === doc.id);
  return <section className="mt-7 space-y-4 border-t border-border pt-5">
    <div className="flex items-center justify-between"><h2 className="font-semibold">{doc.number}</h2><Button size="sm" variant="ghost" onClick={close}>Close</Button></div>
    <ul className="text-sm">{items.map(i => <li key={i.id} className="flex justify-between border-b border-border py-2"><span>{i.description} · {Number(i.quantity)} {i.unit}</span><span className="tabular-nums">{ksh(Number(i.net_amount))} + VAT {ksh(Number(i.tax_amount))}</span></li>)}</ul>
    <p className="text-right text-sm font-medium">Total {ksh(Number(doc.total))}</p>
    {doc.status === "draft" && canWrite(data.role) && <div className="flex flex-wrap items-end gap-2"><div className="w-48"><Label className="text-xs">Paid from</Label><select aria-label="Paid from" className={selectCls} value={acct} onChange={e => setAcct(e.target.value)}>{accts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><Button size="sm" onClick={() => m.mutate()} disabled={m.isPending}>{m.isPending ? "Posting…" : "Post expense"}</Button></div>}
    {doc.status === "posted" && <p className="text-xs text-muted-foreground">Posted: Operating Expenses + Input VAT (debit), payment account (credit).</p>}
    <Err e={m.error} />
    <ApprovalControls data={data} doc={doc} />
  </section>;
}

// ---------- Approvals queue ----------
export function Approvals({ data }: { data: KenyaData }) {
  const pending = data.documents.filter(d => d.approval_status === "pending" && d.status === "draft");
  const history = data.documents.filter(d => ["approved", "rejected"].includes(d.approval_status)).slice(0, 30);
  const t = Number(data.company.approval_threshold);
  return <>
    <p className="mb-5 text-sm text-muted-foreground">{t > 0 ? `Invoices and expenses of ${ksh(t)} or more need owner or manager approval before posting.` : "Approval threshold is off. The owner can set one in Tax / eTIMS settings."}</p>
    <h2 className="mb-3 text-sm font-semibold">Waiting for approval ({pending.length})</h2>
    {pending.length === 0 ? <p className="mb-8 border-y border-border py-6 text-sm text-muted-foreground">Nothing is waiting.</p> : <div className="mb-8 space-y-4">{pending.map(d => <div key={d.id} className="border-y border-border py-3"><p className="text-sm"><span className="font-mono text-xs">{d.number}</span> · <span className="capitalize">{d.kind}</span> · {partyName(data, d.party_id) || "—"} · <span className="font-medium">{ksh(Number(d.total))}</span></p><ApprovalControls data={data} doc={d} /></div>)}</div>}
    <h2 className="mb-3 text-sm font-semibold">Recent decisions</h2>
    <ul className="text-sm">{history.map(d => <li key={d.id} className="flex justify-between border-b border-border py-2"><span><span className="font-mono text-xs">{d.number}</span> · {ksh(Number(d.total))}{d.approval_note ? ` — ${d.approval_note}` : ""}</span><span className="capitalize">{d.approval_status}{d.approved_at ? ` · ${d.approved_at.slice(0, 10)}` : ""}</span></li>)}{history.length === 0 && <li className="text-muted-foreground">No decisions yet.</li>}</ul>
  </>;
}

// ---------- Tax / eTIMS settings ----------
export function TaxSettings({ data }: { data: KenyaData }) {
  const refresh = useRefresh(); const saveTax = useServerFn(saveKenyaTaxCode); const saveCtl = useServerFn(saveKenyaControls);
  const taxEditable = ["owner", "accountant"].includes(data.role); const owner = data.role === "owner";
  const [edit, setEdit] = useState<{ id: string | null; name: string; rate: string; treatment: string } | null>(null);
  const [ctl, setCtl] = useState({ mode: data.company.etims_mode as "disabled" | "test", threshold: String(data.company.approval_threshold) });
  const tax = useMutation({ mutationFn: () => saveTax({ data: { company_id: data.company.id, id: edit!.id, name: edit!.name, rate: Number(edit!.rate), treatment: edit!.treatment as "standard" } }), onSuccess: () => { setEdit(null); refresh(); } });
  const c = useMutation({ mutationFn: () => saveCtl({ data: { company_id: data.company.id, etims_mode: ctl.mode, threshold: Number(ctl.threshold) || 0 } }), onSuccess: refresh });
  const passed = data.etims.filter(s => s.status === "test_passed").length;
  return <div className="grid gap-10 lg:grid-cols-2">
    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Tax codes</h2>{taxEditable && <Button size="sm" variant="outline" onClick={() => setEdit({ id: null, name: "", rate: "0", treatment: "custom" })}><Plus className="mr-1 h-4 w-4" />Add</Button>}</div>
      <ul className="text-sm">{data.taxes.map(t => <li key={t.id} className="flex items-center justify-between border-b border-border py-2"><span>{t.name} <span className="text-xs capitalize text-muted-foreground">{t.treatment.replace("_", "-")}</span></span><span className="flex items-center gap-2 tabular-nums">{Number(t.rate)}%{taxEditable && <Button size="sm" variant="ghost" onClick={() => setEdit({ id: t.id, name: t.name, rate: String(t.rate), treatment: t.treatment })}>Edit</Button>}</span></li>)}</ul>
      <p className="mt-2 text-xs text-muted-foreground">Rate changes apply to new documents only; posted documents keep their VAT.</p>
      {edit && <form className="mt-4 grid gap-2 sm:grid-cols-4" onSubmit={e => { e.preventDefault(); tax.mutate(); }}>
        <Input aria-label="Tax name" required placeholder="Name" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
        <Input aria-label="Tax rate" type="number" step="0.01" min="0" max="100" value={edit.rate} onChange={e => setEdit({ ...edit, rate: e.target.value })} />
        <select aria-label="Treatment" className={selectCls} value={edit.treatment} onChange={e => setEdit({ ...edit, treatment: e.target.value })}>{["standard", "zero", "exempt", "non_vat", "custom"].map(t => <option key={t} value={t}>{t}</option>)}</select>
        <div className="flex gap-1"><Button type="submit" size="sm" disabled={tax.isPending}>Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div>
        <div className="sm:col-span-4"><Err e={tax.error} /></div>
      </form>}
    </section>
    <section>
      <h2 className="mb-3 text-sm font-semibold">KRA eTIMS & approvals</h2>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); c.mutate(); }}>
        <div><Label className="text-xs">eTIMS connection</Label><select aria-label="eTIMS mode" disabled={!owner} className={selectCls} value={ctl.mode} onChange={e => setCtl({ ...ctl, mode: e.target.value as "test" })}><option value="disabled">Disabled</option><option value="test">Test mode (local validation only)</option></select></div>
        <p className="text-xs text-muted-foreground">Live submission isn't available: it needs an approved KRA eTIMS integration and device credentials. Test mode checks invoices for KRA PINs, VAT and totals and records the result; nothing is sent to KRA. {passed} invoice check{passed === 1 ? "" : "s"} passed so far.</p>
        <div><Label className="text-xs">Approval threshold (KSh, 0 = off)</Label><Input aria-label="Approval threshold" disabled={!owner} type="number" min="0" step="1" value={ctl.threshold} onChange={e => setCtl({ ...ctl, threshold: e.target.value })} /></div>
        {owner ? <Button type="submit" size="sm" disabled={c.isPending}>{c.isPending ? "Saving…" : "Save settings"}</Button> : <p className="text-xs text-muted-foreground">Only the company owner can change these.</p>}
        <Err e={c.error} />
      </form>
    </section>
  </div>;
}
