import { Suspense, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, Plus, Search, ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { kenyaOptions, kenyaSections, type KenyaData, type KenyaSection } from "@/lib/kenya-erp";
import { formatMoney } from "@/lib/location";
import { PartyEditor } from "./PartyEditor";
import { CompanySettings } from "./CompanySettings";
import { Invoices, StockMovements, PurchaseOrders, SupplierBills } from "./KenyaOperations";
import { FinancialStatements } from "./KenyaStatements";
import { SalesOrders, Expenses, Approvals, TaxSettings, CsvButton, exportLedgerCsv } from "./KenyaFinance";

export function KenyaWorkspace({ section }: { section: KenyaSection }) {
  const { location } = useLocation();
  if (location.warehouseCode !== "WH-NBO") return <AppShell title="Kenya Accounting"><div className="py-12 text-center"><Building2 className="mx-auto mb-4 h-8 w-8 text-primary" /><h2 className="font-semibold">Select Arquane Surfaces Kenya Limited</h2><p className="mt-2 text-sm text-muted-foreground">Kenya company records are not available in this location.</p></div></AppShell>;
  return <Suspense fallback={<AppShell title={kenyaSections[section]}><p role="status" className="text-muted-foreground">Loading Kenya company records…</p></AppShell>}><KenyaContent section={section} warehouseId={location.id} /></Suspense>;
}

function KenyaContent({ section, warehouseId }: { section: KenyaSection; warehouseId: string }) {
  const { data } = useSuspenseQuery(kenyaOptions(warehouseId));
  const qc = useQueryClient();
  const setup = useMutation({ mutationFn: async () => { if (!data) throw new Error("Company access required"); const result = await supabase.rpc("erp_initialize", { p_company: data.company.id }); if (result.error) throw result.error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["kenya-erp"] }) });
  if (!data) return <AppShell title="Kenya Accounting"><p role="alert" className="text-muted-foreground">You do not have membership in this Kenya company. Contact its owner.</p></AppShell>;
  const editable = ["owner", "accountant", "manager"].includes(data.role);
  return <AppShell title={kenyaSections[section]} subtitle={data.company.name}>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Kenya company · KES<span className="border-l border-border pl-2 capitalize">{data.role}</span></div><div className="flex flex-wrap gap-1">{(["overview", "customers", "sales_orders", "invoices", "suppliers", "purchase_orders", "bills", "expenses", "stock", "approvals", "reports", "tax", "accounts", "journals", "settings"] as const).map(key => <Button asChild key={key} size="sm" variant={section === key ? "secondary" : "ghost"}><Link to="/kenya/$section" params={{ section: key }}>{key === "overview" ? "Overview" : key === "accounts" ? "Accounts" : key === "settings" ? "Settings" : key === "reports" ? "Statements" : key === "purchase_orders" ? "Purchase Orders" : key === "bills" ? "Bills" : key === "sales_orders" ? "Sales Orders" : key === "tax" ? "Tax / eTIMS" : kenyaSections[key]}</Link></Button>)}</div></div>
    {section === "overview" && <Overview data={data} />}
    {(section === "customers" || section === "suppliers") && <Parties data={data} kind={section === "customers" ? "customer" : "supplier"} />}
    {section === "accounts" && <><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-sm font-semibold">Company chart of accounts</h2>{data.accounts.length === 0 && editable && <Button size="sm" onClick={() => setup.mutate()} disabled={setup.isPending}><BookOpen className="mr-2 h-4 w-4" />{setup.isPending ? "Setting up…" : "Initialize accounts & tax codes"}</Button>}</div>{setup.error && <p role="alert" className="mb-3 text-sm text-destructive">{setup.error.message}</p>}<Accounts data={data} /></>}
    {section === "journals" && <><div className="mb-4 flex justify-end"><CsvButton label="Export ledger CSV" onClick={() => exportLedgerCsv(data)} /></div><Journals data={data} /></>}
    {section === "sales_orders" && <SalesOrders data={data} />}
    {section === "expenses" && <Expenses data={data} />}
    {section === "approvals" && <Approvals data={data} />}
    {section === "tax" && <TaxSettings data={data} />}
    {section === "invoices" && <Invoices data={data} />}
    {section === "stock" && <StockMovements data={data} />}
    {section === "purchase_orders" && <PurchaseOrders data={data} />}
    {section === "bills" && <SupplierBills data={data} />}
    {section === "reports" && <FinancialStatements data={data} />}
    {section === "settings" && <CompanySettings data={data} />}
    {!(["overview", "customers", "sales_orders", "invoices", "suppliers", "purchase_orders", "bills", "expenses", "stock", "approvals", "reports", "tax", "accounts", "journals", "settings"] as string[]).includes(section) && <p className="py-12 text-center text-sm text-muted-foreground">This workflow is not available yet.</p>}
  </AppShell>;
}

function Overview({ data }: { data: KenyaData }) {
  const money = (value: number) => formatMoney(value, "KES");
  const balance = (code: string, creditNormal = false) => {
    const ids = new Set(data.accounts.filter(a => a.code === code).map(a => a.id));
    return data.lines.filter(l => ids.has(l.account_id)).reduce((sum, l) => sum + (creditNormal ? Number(l.credit) - Number(l.debit) : Number(l.debit) - Number(l.credit)), 0);
  };
  const sales = balance("4000", true), output = balance("2100", true), input = balance("1300");
  const metrics = [["Sales", sales], ["Receivables", balance("1100")], ["Payables", balance("2000", true)], ["Inventory value", balance("1200")], ["Cash", balance("1000")], ["Bank", balance("1010")], ["M-Pesa", balance("1020")], ["VAT position", output - input]] as const;
  return <><section className="grid grid-cols-1 gap-x-7 gap-y-6 border-b border-border pb-7 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-words text-2xl font-semibold tabular-nums">{money(value)}</p></div>)}</section>
    <section className="mt-7 grid gap-8 lg:grid-cols-2"><div><h2 className="mb-5 text-sm font-semibold">Profit & tax</h2><dl className="space-y-4">{[["Gross profit", sales - balance("5000")], ["Net profit", sales - balance("5000") - balance("6000")], ["Output VAT", output], ["Input VAT", input]].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-4 border-b border-border pb-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{money(Number(value))}</dd></div>)}</dl></div><div><h2 className="mb-5 text-sm font-semibold">Company records</h2>{(["customers", "suppliers", "accounts", "journals"] as const).map(key => <Link key={key} to="/kenya/$section" params={{ section: key }} className="flex items-center justify-between border-b border-border py-3 text-sm"><span>{kenyaSections[key]}</span><span className="flex items-center gap-3 text-muted-foreground">{key === "customers" || key === "suppliers" ? data.parties.filter(p => p.kind === (key === "customers" ? "customer" : "supplier") && !p.archived).length : data[key].length}<ArrowUpRight className="h-4 w-4" /></span></Link>)}</div></section>
    <section className="mt-8"><h2 className="mb-4 text-sm font-semibold">Recent accounting activity</h2>{data.journals.length === 0 ? <div className="border-y border-border py-8 text-sm text-muted-foreground">No posted financial transactions.</div> : <Journals data={data} />}</section>
  </>;
}

function Parties({ data, kind }: { data: KenyaData; kind: "customer" | "supplier" }) {
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ party?: KenyaData["parties"][number] } | null>(null);
  const [selected, setSelected] = useState<KenyaData["parties"][number] | null>(null);
  const rows = data.parties.filter(p => p.kind === kind && !p.archived && [p.name, p.company_name, p.kra_pin, p.city].join(" ").toLowerCase().includes(search.toLowerCase()));
  const editable = ["owner", "accountant", "manager"].includes(data.role);
  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label={`Search ${kind}s`} placeholder={`Search ${kind}s`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>{(editable || data.role === "sales") && <Button size="sm" onClick={() => setEditor({})}><Plus className="mr-1.5 h-4 w-4" />New {kind}</Button>}</div>
    <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>KRA PIN</TableHead><TableHead>City</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Credit limit</TableHead><TableHead /></TableRow></TableHeader><TableBody>{rows.map(p => <TableRow key={p.id}><TableCell><Button variant="link" className="h-auto p-0 text-foreground" onClick={() => setSelected(p)}>{p.name}</Button><p className="mt-1 text-xs text-muted-foreground">{p.company_name}</p></TableCell><TableCell>{p.kra_pin || "—"}</TableCell><TableCell>{p.city || "—"}</TableCell><TableCell>{p.email || p.phone || "—"}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(Number(p.credit_limit), p.currency)}</TableCell><TableCell>{editable && <Button variant="ghost" size="sm" onClick={() => setEditor({ party: p })}>Edit</Button>}</TableCell></TableRow>)}</TableBody></Table>{rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{search ? "No matching records." : `No ${kind}s yet.`}</p>}</div>
    {selected && <section className="mt-7 border-t border-border pt-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{selected.name}</h2><Button size="sm" variant="ghost" onClick={() => setSelected(null)}>Close profile</Button></div><div className="grid gap-4 text-sm sm:grid-cols-3">{[["KRA PIN", selected.kra_pin], ["Contact person", selected.contact_person], ["VAT registered", selected.vat_registered ? "Yes" : "No"], ["Payment terms", `${selected.payment_terms} days`], ["Phone", selected.phone], ["WhatsApp", selected.whatsapp], ["Email", selected.email], ["Address", selected.address], ["County", selected.county], ["Notes", selected.notes]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words">{value || "—"}</p></div>)}</div><p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">{data.documents.filter(d => d.party_id === selected.id).length} financial documents</p></section>}
    {editor && <PartyEditor data={data} kind={kind} party={editor.party} close={() => setEditor(null)} />}
  </>;
}

function Accounts({ data }: { data: KenyaData }) {
  return <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Account</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader><TableBody>{data.accounts.map(a => { const lines = data.lines.filter(l => l.account_id === a.id); return <TableRow key={a.id}><TableCell className="font-mono">{a.code}</TableCell><TableCell>{a.name}</TableCell><TableCell className="capitalize">{a.category}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(lines.reduce((n, l) => n + Number(l.debit), 0), "KES")}</TableCell><TableCell className="text-right tabular-nums">{formatMoney(lines.reduce((n, l) => n + Number(l.credit), 0), "KES")}</TableCell></TableRow>; })}</TableBody></Table>{data.accounts.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No accounts configured.</p>}</div>;
}
function Journals({ data }: { data: KenyaData }) {
  return <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader><TableBody>{data.journals.map(j => { const lines = data.lines.filter(l => l.journal_id === j.id); return <TableRow key={j.id}><TableCell>{j.journal_date}</TableCell><TableCell>{j.description}</TableCell><TableCell className="text-right">{formatMoney(lines.reduce((n, l) => n + Number(l.debit), 0), "KES")}</TableCell><TableCell className="text-right">{formatMoney(lines.reduce((n, l) => n + Number(l.credit), 0), "KES")}</TableCell></TableRow>; })}</TableBody></Table>{data.journals.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No posted journal entries.</p>}</div>;
}