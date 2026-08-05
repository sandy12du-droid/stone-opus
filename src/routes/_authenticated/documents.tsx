import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  FileText, FileSpreadsheet, FileCheck2, Package, Ship, Truck,
  Search, Download, ExternalLink, Filter, Files as FilesIcon,
  Calendar, Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { quotationsListOptions, QUOTATION_STATUS_TONE, currency, fmtDate } from "@/lib/quotations-queries";
import { projectsListOptions, PROJECT_STATUS_LABEL } from "@/lib/projects-queries";
import { shipmentsListOptions, STATUS_LABEL as SHIP_LABEL, STATUS_TONE as SHIP_TONE } from "@/lib/shipping-queries";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Arquane OS" },
      { name: "description", content: "Unified document center: quotations, invoices, work orders, bills of lading and packing lists." },
      { property: "og:title", content: "Documents — Arquane OS" },
      { property: "og:description", content: "Unified document center: quotations, invoices, work orders, bills of lading and packing lists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(quotationsListOptions());
    context.queryClient.ensureQueryData(projectsListOptions());
    context.queryClient.ensureQueryData(shipmentsListOptions());
  },
  errorComponent: ({ error }) => (
    <AppShell title="Documents"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Documents"><div>Not found.</div></AppShell>,
  component: DocumentsPage,
});

type DocKind = "quotation" | "invoice" | "work_order" | "bill_of_lading" | "packing_list";

type DocItem = {
  id: string;
  kind: DocKind;
  code: string;
  title: string;
  party: string;
  amount?: number;
  currency?: string;
  status: string;
  statusTone: string;
  date: string | null;
  href: { to: string; params: Record<string, string> };
};

const KIND_META: Record<DocKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  quotation:      { label: "Quotation",      icon: FileText,       tone: "bg-primary/10 text-primary" },
  invoice:        { label: "Invoice",        icon: FileCheck2,     tone: "bg-success/10 text-success" },
  work_order:     { label: "Work order",     icon: Package,        tone: "bg-info/10 text-info" },
  bill_of_lading: { label: "Bill of lading", icon: Ship,           tone: "bg-accent/15 text-accent-foreground" },
  packing_list:   { label: "Packing list",   icon: FileSpreadsheet, tone: "bg-warning/10 text-warning" },
};

const KIND_FILTERS: { key: "all" | DocKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "quotation", label: "Quotations" },
  { key: "invoice", label: "Invoices" },
  { key: "work_order", label: "Work orders" },
  { key: "bill_of_lading", label: "Bills of lading" },
  { key: "packing_list", label: "Packing lists" },
];

function DocumentsPage() {
  const { data: quotations } = useSuspenseQuery(quotationsListOptions());
  const { data: projects } = useSuspenseQuery(projectsListOptions());
  const { data: shipments } = useSuspenseQuery(shipmentsListOptions());

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | DocKind>("all");

  const docs = useMemo<DocItem[]>(() => {
    const list: DocItem[] = [];

    // Quotations
    for (const q of quotations) {
      const tone = QUOTATION_STATUS_TONE[q.status];
      list.push({
        id: `q-${q.id}`,
        kind: "quotation",
        code: q.number,
        title: q.project_name ?? "Untitled quotation",
        party: q.customer_name ?? "—",
        amount: Number(q.total ?? 0),
        currency: q.currency ?? "USD",
        status: tone?.label ?? q.status,
        statusTone: tone?.className ?? "bg-muted text-muted-foreground border-border",
        date: q.created_at,
        href: { to: "/quotations/$quotationId", params: { quotationId: q.id } },
      });
      // Accepted quotations imply an invoice/proforma exists
      if (q.status === "accepted") {
        list.push({
          id: `inv-${q.id}`,
          kind: "invoice",
          code: q.number.replace("AQ-", "INV-"),
          title: `Invoice — ${q.project_name ?? q.number}`,
          party: q.customer_name ?? "—",
          amount: Number(q.total ?? 0),
          currency: q.currency ?? "USD",
          status: "Issued",
          statusTone: "bg-success/10 text-success border-success/25",
          date: q.decided_at ?? q.updated_at,
          href: { to: "/quotations/$quotationId", params: { quotationId: q.id } },
        });
      }
    }

    // Work orders (derived from project work_orders)
    for (const p of projects) {
      const wos = p.work_orders ?? [];
      for (const w of wos) {
        list.push({
          id: `wo-${w.id}`,
          kind: "work_order",
          code: p.code,
          title: `${p.name} · ${w.stage ?? "queued"}`,
          party: p.customer_name ?? "—",
          status: PROJECT_STATUS_LABEL[p.status] ?? p.status,
          statusTone: "bg-info/10 text-info border-info/25",
          date: p.updated_at ?? p.created_at,
          href: { to: "/projects/$projectId", params: { projectId: p.id } },
        });
      }
    }

    // Bills of lading + packing lists (per shipment)
    for (const s of shipments) {
      if (s.bill_of_lading || s.status !== "planned") {
        list.push({
          id: `bol-${s.id}`,
          kind: "bill_of_lading",
          code: s.bill_of_lading ?? s.reference,
          title: `${s.origin_port ?? "—"} → ${s.destination_port ?? "—"}`,
          party: s.carrier ?? "—",
          amount: s.freight_cost ? Number(s.freight_cost) : undefined,
          currency: s.currency ?? "USD",
          status: SHIP_LABEL[s.status] ?? s.status,
          statusTone: SHIP_TONE[s.status] ?? "bg-muted text-muted-foreground border-border",
          date: s.etd ?? s.created_at,
          href: { to: "/shipping/$shipmentId", params: { shipmentId: s.id } },
        });
      }
      list.push({
        id: `pl-${s.id}`,
        kind: "packing_list",
        code: `PL-${s.reference}`,
        title: `Packing list — ${s.container_number ?? s.reference}`,
        party: s.carrier ?? "—",
        status: SHIP_LABEL[s.status] ?? s.status,
        statusTone: SHIP_TONE[s.status] ?? "bg-muted text-muted-foreground border-border",
        date: s.etd ?? s.created_at,
        href: { to: "/shipping/$shipmentId", params: { shipmentId: s.id } },
      });
    }

    return list.sort((a, b) => {
      const at = a.date ? new Date(a.date).getTime() : 0;
      const bt = b.date ? new Date(b.date).getTime() : 0;
      return bt - at;
    });
  }, [quotations, projects, shipments]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return docs.filter((d) => {
      if (kind !== "all" && d.kind !== kind) return false;
      if (!q) return true;
      return [d.code, d.title, d.party, d.status].some((v) => v.toLowerCase().includes(q));
    });
  }, [docs, query, kind]);

  const counts = useMemo(() => {
    const c: Record<DocKind, number> = {
      quotation: 0, invoice: 0, work_order: 0, bill_of_lading: 0, packing_list: 0,
    };
    for (const d of docs) c[d.kind]++;
    return c;
  }, [docs]);

  const totalValue = useMemo(
    () => docs.filter((d) => d.kind === "invoice" || d.kind === "quotation").reduce((s, d) => s + (d.amount ?? 0), 0),
    [docs],
  );

  return (
    <AppShell
      title="Documents"
      subtitle="Single source of truth for commercial and operational documents across Arquane OS."
    >
      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Documents" value={String(docs.length)} icon={FilesIcon} sub="All record types" />
        <Stat label="Quotations" value={String(counts.quotation)} icon={FileText} sub={`${counts.invoice} invoiced`} />
        <Stat label="Work orders" value={String(counts.work_order)} icon={Package} sub="Fabrication docs" />
        <Stat label="Commercial value" value={currency(totalValue)} icon={FileCheck2} sub="Quotes + invoices" />
      </div>

      {/* AI banner */}
      <div className="mb-4 flex flex-wrap items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 text-accent-foreground" />
        <div className="flex-1">
          <div className="font-medium text-foreground">Document intelligence</div>
          <div className="text-xs text-muted-foreground">
            {counts.invoice} accepted quotations have auto-generated invoices. {counts.packing_list} packing lists ready for export.
          </div>
        </div>
        <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> Bulk export</Button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search code, title, party…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setKind(f.key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                kind === f.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="ml-auto"><Filter className="mr-1.5 h-3.5 w-3.5" /> More filters</Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Type</th>
              <th className="px-4 py-2.5 text-left font-medium">Reference</th>
              <th className="px-4 py-2.5 text-left font-medium">Title</th>
              <th className="px-4 py-2.5 text-left font-medium">Party</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Value</th>
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="px-4 py-2.5 text-right font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No documents match your filters.
                </td>
              </tr>
            )}
            {filtered.map((d) => {
              const meta = KIND_META[d.kind];
              const Icon = meta.icon;
              return (
                <tr key={d.id} className="border-t border-border transition-colors hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", meta.tone)}>
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{d.code}</td>
                  <td className="px-4 py-2.5 text-foreground">{d.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.party}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", d.statusTone)}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                    {d.amount != null ? currency(d.amount, d.currency ?? "USD") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(d.date)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={d.href.to as "/quotations/$quotationId"}
                      params={d.href.params as { quotationId: string }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sr-only"><Truck /></div>
    </AppShell>
  );
}

function Stat({
  label, value, sub, icon: Icon,
}: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
