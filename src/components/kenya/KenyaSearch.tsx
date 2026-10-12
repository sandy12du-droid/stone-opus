import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatMoney } from "@/lib/location";
import { searchKenya } from "@/lib/kenya-search";
import { runKenyaSelfTest } from "@/lib/kenya-erp.functions";
import type { KenyaData } from "@/lib/kenya-erp";

const kindLabel: Record<string, string> = { invoice: "Invoice", sales_order: "Sales order", expense: "Expense", refund: "Refund", stock: "Stock movement", ledger: "Ledger entry", credit_note: "Credit note", bill: "Bill", purchase_order: "Purchase order" };

export function KenyaSearch({ data }: { data: KenyaData }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchKenya(data, q), [data, q]);
  return <>
    <div className="relative mb-5 w-full sm:w-96"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Search Kenya records" placeholder="Search invoices, orders, expenses, refunds, stock, ledger…" value={q} onChange={e => setQ(e.target.value)} className="pl-9" /></div>
    {!q.trim() ? <p className="border-y border-border py-8 text-sm text-muted-foreground">Results only include {data.company.name} records.</p>
      : results.length === 0 ? <p className="border-y border-border py-8 text-sm text-muted-foreground">No Kenya records match “{q}”.</p>
      : <div className="overflow-x-auto border-y border-border"><Table><TableHeader><TableRow><TableHead>Record</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody>{results.map(r => <TableRow key={`${r.kind}:${r.id}`}><TableCell><Link to="/kenya/$section" params={{ section: r.section }} className="font-medium hover:underline">{r.label}</Link><p className="mt-1 text-xs capitalize text-muted-foreground">{r.sub}</p></TableCell><TableCell>{kindLabel[r.kind]}</TableCell><TableCell className="tabular-nums">{r.date}</TableCell><TableCell className="text-right tabular-nums">{r.amount === null ? "—" : formatMoney(r.amount, "KES")}</TableCell></TableRow>)}</TableBody></Table></div>}
    {["owner", "accountant", "manager"].includes(data.role) && <SelfTest companyId={data.company.id} />}
  </>;
}

function SelfTest({ companyId }: { companyId: string }) {
  const run = useMutation({ mutationFn: () => runKenyaSelfTest({ data: { company_id: companyId } }) });
  return <section className="mt-10 border-t border-border pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Ledger integrity check</h2><p className="mt-1 text-xs text-muted-foreground">Runs a test invoice, payment, credit note, refund, expense and stock movement, checks the books balance and stay Kenya-only, then discards everything.</p></div><Button size="sm" variant="outline" onClick={() => run.mutate()} disabled={run.isPending}><ShieldCheck className="mr-2 h-4 w-4" />{run.isPending ? "Checking…" : "Run check"}</Button></div>
    {run.data && <p role="status" className={`mt-3 text-sm ${run.data.passed ? "text-primary" : "text-destructive"}`}>{run.data.passed ? "Passed" : "Failed"}: {run.data.message.replace(/^(PASS|FAIL): /, "")}</p>}
    {run.error && <p role="alert" className="mt-3 text-sm text-destructive">{run.error.message}</p>}</section>;
}
