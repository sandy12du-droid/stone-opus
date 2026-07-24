import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText, Plus, Search, Filter, TrendingUp, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  quotationsListOptions, QUOTATION_STATUS_TONE, currency, fmtDate,
  type QuotationStatus,
} from "@/lib/quotations-queries";
import { createQuotation } from "@/lib/quotations.functions";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — Arquane OS" },
      { name: "description", content: "Live quotation workspace — draft, send, approve, and reserve slabs against real inventory." },
      { property: "og:title", content: "Quotations — Arquane OS" },
      { property: "og:description", content: "Live quotation workspace — draft, send, approve, and reserve slabs against real inventory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(quotationsListOptions()),
  errorComponent: ({ error }) => (
    <AppShell title="Quotations"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Quotations"><div>Not found.</div></AppShell>,
  component: QuotationsPage,
});

const STATUS_FILTERS: { key: "all" | QuotationStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "expired", label: "Expired" },
];

function QuotationsPage() {
  const { data: rows } = useSuspenseQuery(quotationsListOptions());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | QuotationStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.number.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        (r.customer_company ?? "").toLowerCase().includes(q) ||
        (r.project_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  const kpi = useMemo(() => {
    const open = rows.filter((r) => r.status === "sent" || r.status === "in_review");
    const accepted = rows.filter((r) => r.status === "accepted");
    const draft = rows.filter((r) => r.status === "draft");
    const sum = (arr: typeof rows) => arr.reduce((s, r) => s + Number(r.total ?? 0), 0);
    return {
      openValue: sum(open),
      openCount: open.length,
      wonValue: sum(accepted),
      wonCount: accepted.length,
      draftCount: draft.length,
      totalCount: rows.length,
    };
  }, [rows]);

  return (
    <AppShell
      title="Quotations"
      subtitle="Real quotations, real inventory. Slabs reserve automatically when a quotation is sent."
      actions={<NewQuotationButton />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Kpi icon={FileText}       tone="muted"    label="Total quotations" value={String(kpi.totalCount)} hint={`${kpi.draftCount} in draft`} />
        <Kpi icon={Clock}          tone="primary"  label="Open value"        value={currency(kpi.openValue)} hint={`${kpi.openCount} awaiting decision`} />
        <Kpi icon={CheckCircle2}   tone="success"  label="Won value"         value={currency(kpi.wonValue)}  hint={`${kpi.wonCount} accepted`} />
        <Kpi icon={TrendingUp}     tone="accent"   label="Win rate"          value={winRate(rows)}           hint="Accepted ÷ decided" />
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by number, customer, project…"
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-canvas p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors",
                  status === f.key ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" /> More filters
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Incoterm</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-sm text-muted-foreground">
                  No quotations match this view.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((q) => {
              const tone = QUOTATION_STATUS_TONE[q.status];
              return (
                <TableRow key={q.id} className="cursor-pointer">
                  <TableCell className="font-mono text-[12px]">
                    <Link to="/quotations/$quotationId" params={{ quotationId: q.id }} className="hover:text-primary">
                      {q.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{q.customer_flag}</span>
                      <div>
                        <div className="text-[13px] font-medium">{q.customer_company ?? q.customer_name}</div>
                        <div className="text-[11px] text-muted-foreground">{q.customer_country}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">{q.project_name ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.items?.length ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {currency(Number(q.total ?? 0), q.currency)}
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{q.incoterm}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{fmtDate(q.valid_until)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(q.owner_name)}</AvatarFallback></Avatar>
                      <span className="text-[12px]">{q.owner_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border", tone.className)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                      {tone.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon, tone, label, value, hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "muted" | "primary" | "success" | "accent";
  label: string; value: string; hint?: string;
}) {
  const tones = {
    muted:   "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    accent:  "bg-accent/15 text-accent-foreground",
  } as const;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("h-7 w-7 rounded-md grid place-items-center", tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 text-[22px] font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function winRate(rows: { status: QuotationStatus }[]) {
  const decided = rows.filter((r) => r.status === "accepted" || r.status === "rejected").length;
  const won = rows.filter((r) => r.status === "accepted").length;
  if (decided === 0) return "—";
  return `${Math.round((won / decided) * 100)}%`;
}

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function NewQuotationButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_company: "", customer_country: "",
    project_name: "", incoterm: "FOB", currency: "USD", owner_name: "Sofia Marin",
  });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createQuotation);
  const mutation = useMutation({
    mutationFn: (input: typeof form) => create({ data: input }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["quotations"] });
      setOpen(false);
      navigate({ to: "/quotations/$quotationId", params: { quotationId: res.id } });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New quotation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle>New quotation</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Customer name" value={form.customer_name}     onChange={(v) => setForm({ ...form, customer_name: v })} />
          <Field label="Company"       value={form.customer_company}  onChange={(v) => setForm({ ...form, customer_company: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" value={form.customer_country} onChange={(v) => setForm({ ...form, customer_country: v })} />
            <Field label="Project" value={form.project_name}     onChange={(v) => setForm({ ...form, project_name: v })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Incoterm" value={form.incoterm} onChange={(v) => setForm({ ...form, incoterm: v })} />
            <Field label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
            <Field label="Owner"    value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} />
          </div>
          {mutation.error && (
            <div className="flex items-center gap-1.5 text-[12px] text-destructive">
              <XCircle className="h-3.5 w-3.5" /> {(mutation.error as Error).message}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.customer_name || mutation.isPending}
          >
            {mutation.isPending ? "Creating…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}
