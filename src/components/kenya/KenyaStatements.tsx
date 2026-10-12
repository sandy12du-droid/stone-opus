import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { KenyaData } from "@/lib/kenya-erp";
import { formatMoney } from "@/lib/location";
import { downloadStatementPdf } from "@/lib/kenya-pdf";

const ksh = (n: number) => formatMoney(n, "KES");
const CASH = ["1000", "1010", "1020"];

export function FinancialStatements({ data }: { data: KenyaData }) {
  const year = new Date().getFullYear();
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<"pl" | "bs" | "cf">("pl");

  const s = useMemo(() => {
    const dateOf = new Map(data.journals.map(j => [j.id, j.journal_date]));
    const acct = new Map(data.accounts.map(a => [a.id, a]));
    const lines = data.lines.map(l => ({ ...l, date: dateOf.get(l.journal_id) ?? "", a: acct.get(l.account_id)!, dr: Number(l.debit), cr: Number(l.credit) })).filter(l => l.a);
    const sum = (rows: typeof lines, pred: (l: (typeof lines)[number]) => boolean, creditNormal: boolean) => rows.filter(pred).reduce((t, l) => t + (creditNormal ? l.cr - l.dr : l.dr - l.cr), 0);
    const byAccount = (rows: typeof lines, cat: string, creditNormal: boolean) => data.accounts.filter(a => a.category === cat).map(a => ({ code: a.code, name: a.name, amount: sum(rows, l => l.account_id === a.id, creditNormal) })).filter(r => Math.abs(r.amount) > 0.004);
    const period = lines.filter(l => l.date >= from && l.date <= to);
    const asOf = lines.filter(l => l.date <= to);
    const before = lines.filter(l => l.date < from);
    const revenue = byAccount(period, "revenue", true), cost = byAccount(period, "cost", false), expense = byAccount(period, "expense", false);
    const tot = (r: { amount: number }[]) => r.reduce((t, x) => t + x.amount, 0);
    const earnings = (rows: typeof lines) => sum(rows, l => l.a.category === "revenue", true) - sum(rows, l => l.a.category === "cost" || l.a.category === "expense", false);
    // cash flow
    const cashJournals = new Set(period.filter(l => CASH.includes(l.a.code)).map(l => l.journal_id));
    const flows = { "Receipts from customers": 0, "Payments to suppliers": 0, "Operating expenses paid": 0, "Other cash movements": 0 } as Record<string, number>;
    for (const j of cashJournals) {
      const jl = period.filter(l => l.journal_id === j);
      const net = jl.filter(l => CASH.includes(l.a.code)).reduce((t, l) => t + l.dr - l.cr, 0);
      const codes = jl.filter(l => !CASH.includes(l.a.code)).map(l => l.a.code);
      const key = codes.includes("1100") ? "Receipts from customers" : codes.includes("2000") ? "Payments to suppliers" : codes.some(c => c === "6000" || c === "1300") ? "Operating expenses paid" : "Other cash movements";
      flows[key] += net;
    }
    const opening = sum(before, l => CASH.includes(l.a.code), false);
    return {
      revenue, cost, expense, totRev: tot(revenue), totCost: tot(cost), totExp: tot(expense),
      assets: byAccount(asOf, "asset", false), liabilities: byAccount(asOf, "liability", true), equity: byAccount(asOf, "equity", true),
      retained: earnings(asOf), flows, opening, closing: sum(asOf, l => CASH.includes(l.a.code), false),
    };
  }, [data, from, to]);

  const totAssets = s.assets.reduce((t, r) => t + r.amount, 0), totLiab = s.liabilities.reduce((t, r) => t + r.amount, 0), totEq = s.equity.reduce((t, r) => t + r.amount, 0) + s.retained;
  const netFlow = Object.values(s.flows).reduce((t, v) => t + v, 0);

  const pl = { sections: [
    { title: "Revenue", rows: s.revenue, total: ["Total revenue", s.totRev] as [string, number] },
    { title: "Cost of sales", rows: s.cost, total: ["Gross profit", s.totRev - s.totCost] as [string, number] },
    { title: "Operating expenses", rows: s.expense, total: ["Total expenses", s.totExp] as [string, number] },
  ], grand: ["Net profit", s.totRev - s.totCost - s.totExp] as [string, number], note: undefined as string | undefined };
  const bs = { sections: [
    { title: "Assets", rows: s.assets, total: ["Total assets", totAssets] as [string, number] },
    { title: "Liabilities", rows: s.liabilities, total: ["Total liabilities", totLiab] as [string, number] },
    { title: "Equity", rows: [...s.equity, { code: "", name: "Current earnings", amount: s.retained }], total: ["Total equity", totEq] as [string, number] },
  ], grand: ["Liabilities + equity", totLiab + totEq] as [string, number], note: Math.abs(totAssets - totLiab - totEq) < 0.01 ? "Balanced: assets equal liabilities plus equity." : "Out of balance — review ledger." };
  const cf = { sections: [
    { title: "Opening cash (Cash, Bank, M-Pesa)", rows: [], total: ["Opening balance", s.opening] as [string, number] },
    { title: "Cash flows in period", rows: Object.entries(s.flows).filter(([, v]) => Math.abs(v) > 0.004).map(([name, amount]) => ({ code: "", name, amount })), total: ["Net cash flow", netFlow] as [string, number] },
  ], grand: ["Closing cash", s.closing] as [string, number], note: undefined as string | undefined };
  const current = tab === "pl" ? pl : tab === "bs" ? bs : cf;
  const title = tab === "pl" ? "Profit and Loss" : tab === "bs" ? "Balance Sheet" : "Cash Flow";
  const period = tab === "bs" ? `as of ${to}` : `${from} to ${to}`;

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div className="flex flex-wrap gap-1">{([["pl", "Profit & Loss"], ["bs", "Balance Sheet"], ["cf", "Cash Flow"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={tab === k ? "secondary" : "ghost"} onClick={() => setTab(k)}>{l}</Button>)}</div>
      <div className="flex flex-wrap items-end gap-3">
        {tab !== "bs" && <div><Label className="text-xs">From</Label><Input aria-label="From date" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></div>}
        <div><Label className="text-xs">{tab === "bs" ? "As of" : "To"}</Label><Input aria-label="To date" type="date" value={to} min={tab === "bs" ? undefined : from} onChange={e => setTo(e.target.value)} /></div>
        <Button size="sm" variant="outline" onClick={() => downloadStatementPdf(data, title, period, current.sections, current.grand, current.note)}>Download PDF</Button>
      </div>
    </div>
    <p className="mb-5 text-xs text-muted-foreground">{data.company.name} · {period} · KSh · from posted ledger entries</p>
    <Statement sections={current.sections} grand={current.grand} note={current.note} />
  </>;
}

type Row = { code: string; name: string; amount: number };
function Statement({ sections, grand, note }: { sections: { title: string; rows: Row[]; total: [string, number] }[]; grand: [string, number]; note?: string }) {
  return <div className="max-w-2xl">
    {sections.map(sec => <section key={sec.title} className="mb-6">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sec.title}</h3>
      {sec.rows.map(r => <div key={r.code + r.name} className="flex justify-between border-b border-border py-2 text-sm"><span>{r.code && <span className="mr-2 font-mono text-xs text-muted-foreground">{r.code}</span>}{r.name}</span><span className="tabular-nums">{ksh(r.amount)}</span></div>)}
      {sec.rows.length === 0 && sec.title !== "Opening cash (Cash, Bank, M-Pesa)" && <p className="border-b border-border py-2 text-sm text-muted-foreground">No entries.</p>}
      <div className="flex justify-between py-2 text-sm font-medium"><span>{sec.total[0]}</span><span className="tabular-nums">{ksh(sec.total[1])}</span></div>
    </section>)}
    <div className="flex justify-between border-t-2 border-foreground pt-3 text-base font-semibold"><span>{grand[0]}</span><span className="tabular-nums">{ksh(grand[1])}</span></div>
    {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
  </div>;
}
