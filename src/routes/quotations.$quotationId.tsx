import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, CheckCircle2, XCircle, Send, Trash2, Plus, Package,
  Sparkles, Building2, Mail, MapPin, Calendar, Percent, FileDown,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  quotationDetailOptions, QUOTATION_STATUS_TONE, WORKFLOW_STEPS,
  currency, fmtDate,
} from "@/lib/quotations-queries";
import { productsWithStockOptions } from "@/lib/inventory-queries";
import {
  updateQuotationHeader, addQuotationItem, updateQuotationItem,
  removeQuotationItem, sendQuotation, decideQuotation, deleteQuotation,
} from "@/lib/quotations.functions";

export const Route = createFileRoute("/quotations/$quotationId")({
  head: () => ({
    meta: [
      { title: "Quotation — Arquane OS" },
      { name: "description", content: "Quotation editor with live PDF preview, approval workflow, and slab reservation." },
      { property: "og:title", content: "Quotation — Arquane OS" },
      { property: "og:description", content: "Quotation editor with live PDF preview, approval workflow, and slab reservation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(quotationDetailOptions(params.quotationId)),
  errorComponent: ({ error }) => (
    <AppShell title="Quotation"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Quotation"><div className="text-sm text-muted-foreground">Quotation not found.</div></AppShell>
  ),
  component: QuotationDetailPage,
});

function QuotationDetailPage() {
  const { quotationId } = Route.useParams();
  const { data: q } = useSuspenseQuery(quotationDetailOptions(quotationId));
  const qc = useQueryClient();
  const router = useRouter();

  if (!q) {
    return <AppShell title="Quotation"><div className="text-sm text-muted-foreground">Quotation not found.</div></AppShell>;
  }

  const tone = QUOTATION_STATUS_TONE[q.status];

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["quotations"] });
    await qc.invalidateQueries({ queryKey: ["inventory"] });
  };

  const updateHeader = useServerFn(updateQuotationHeader);
  const send = useServerFn(sendQuotation);
  const decide = useServerFn(decideQuotation);
  const del = useServerFn(deleteQuotation);

  const headerMutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateHeader>[0]["data"]["patch"]) =>
      updateHeader({ data: { id: q.id, patch } }),
    onSuccess: invalidate,
  });
  const sendMutation = useMutation({
    mutationFn: () => send({ data: { id: q.id } }),
    onSuccess: invalidate,
  });
  const decideMutation = useMutation({
    mutationFn: (decision: "accepted" | "rejected") => decide({ data: { id: q.id, decision } }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: () => del({ data: { id: q.id } }),
    onSuccess: async () => {
      await invalidate();
      router.navigate({ to: "/quotations" });
    },
  });

  return (
    <AppShell
      title={q.number}
      subtitle={q.project_name ?? q.customer_company ?? q.customer_name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quotations"><ArrowLeft className="h-4 w-4 mr-1" />All quotations</Link>
          </Button>
          {(q.status === "draft" || q.status === "in_review") && (
            <Button size="sm" className="gap-1.5" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || q.items.length === 0}>
              <Send className="h-4 w-4" /> {sendMutation.isPending ? "Sending…" : "Send & reserve slabs"}
            </Button>
          )}
          {q.status === "sent" && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => decideMutation.mutate("rejected")}>
                <XCircle className="h-4 w-4" /> Mark rejected
              </Button>
              <Button size="sm" className="gap-1.5 bg-success text-success-foreground hover:bg-success/90" onClick={() => decideMutation.mutate("accepted")}>
                <CheckCircle2 className="h-4 w-4" /> Mark accepted
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate()} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border", tone.className)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />{tone.label}
        </span>
        <WorkflowSteps current={q.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6 min-w-0">
          <HeaderEditor q={q} onSave={(patch) => headerMutation.mutate(patch)} />
          <ItemsEditor q={q} onChange={invalidate} />
        </div>
        <div className="space-y-6">
          <PdfPreview q={q} />
          <Timeline events={q.events} />
        </div>
      </div>
    </AppShell>
  );
}

// -------- Workflow steps --------
function WorkflowSteps({ current }: { current: string }) {
  const idx = WORKFLOW_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-1.5">
      {WORKFLOW_STEPS.map((s, i) => {
        const done = idx >= i && idx !== -1;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium",
              done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", done ? "bg-primary" : "bg-muted-foreground/40")} />
              {s.label}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && <span className="text-muted-foreground/40">→</span>}
          </div>
        );
      })}
    </div>
  );
}

// -------- Header editor --------
type HeaderPatch = Parameters<typeof updateQuotationHeader>[0]["data"]["patch"];

function HeaderEditor({
  q, onSave,
}: {
  q: import("@/lib/quotations-queries").QuotationWithItems;
  onSave: (patch: HeaderPatch) => void;
}) {
  const readOnly = q.status !== "draft" && q.status !== "in_review";
  const [f, setF] = useState({
    customer_name: q.customer_name,
    customer_company: q.customer_company ?? "",
    customer_email: q.customer_email ?? "",
    customer_country: q.customer_country ?? "",
    project_name: q.project_name ?? "",
    incoterm: q.incoterm,
    currency: q.currency,
    valid_until: q.valid_until ?? "",
    tax_rate: q.tax_rate,
    notes: q.notes ?? "",
  });

  const commit = () => {
    onSave({
      customer_name: f.customer_name,
      customer_company: f.customer_company || null,
      customer_email: f.customer_email || null,
      customer_country: f.customer_country || null,
      project_name: f.project_name || null,
      incoterm: f.incoterm,
      currency: f.currency,
      valid_until: f.valid_until || null,
      tax_rate: Number(f.tax_rate) || 0,
      notes: f.notes || null,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Header</div>
          <div className="text-[15px] font-semibold">Customer & terms</div>
        </div>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={commit}>Save changes</Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SmallField label="Customer" icon={Building2} value={f.customer_name}    onChange={(v) => setF({ ...f, customer_name: v })} readOnly={readOnly} />
        <SmallField label="Company"  icon={Building2} value={f.customer_company} onChange={(v) => setF({ ...f, customer_company: v })} readOnly={readOnly} />
        <SmallField label="Email"    icon={Mail}      value={f.customer_email}   onChange={(v) => setF({ ...f, customer_email: v })} readOnly={readOnly} />
        <SmallField label="Country"  icon={MapPin}    value={f.customer_country} onChange={(v) => setF({ ...f, customer_country: v })} readOnly={readOnly} />
        <SmallField label="Project"  value={f.project_name} onChange={(v) => setF({ ...f, project_name: v })} readOnly={readOnly} />
        <SmallField label="Incoterm" value={f.incoterm}     onChange={(v) => setF({ ...f, incoterm: v })}     readOnly={readOnly} />
        <SmallField label="Currency" value={f.currency}     onChange={(v) => setF({ ...f, currency: v })}     readOnly={readOnly} />
        <SmallField label="Valid until" icon={Calendar} type="date" value={f.valid_until} onChange={(v) => setF({ ...f, valid_until: v })} readOnly={readOnly} />
        <SmallField label="Tax rate" icon={Percent} value={String(f.tax_rate)} onChange={(v) => setF({ ...f, tax_rate: Number(v) || 0 })} readOnly={readOnly} />
      </div>
      <div className="mt-3 grid gap-1.5">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</Label>
        <Textarea value={f.notes} readOnly={readOnly} onChange={(e) => setF({ ...f, notes: e.target.value })} className="min-h-[72px]" />
      </div>
    </div>
  );
}

function SmallField({
  label, value, onChange, readOnly, icon: Icon, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; readOnly?: boolean;
  icon?: React.ComponentType<{ className?: string }>; type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} className={cn("h-9", readOnly && "bg-canvas text-muted-foreground")} />
    </div>
  );
}

// -------- Items editor --------
function ItemsEditor({
  q, onChange,
}: {
  q: { id: string; status: string; currency: string; items: import("@/lib/quotations-queries").QuotationItem[]; subtotal: number; tax_rate: number; tax_amount: number; total: number };
  onChange: () => void | Promise<void>;
}) {
  const readOnly = q.status !== "draft" && q.status !== "in_review";
  const upd = useServerFn(updateQuotationItem);
  const rm  = useServerFn(removeQuotationItem);
  const updM = useMutation({ mutationFn: (v: { id: string; quantity?: number; unit_price?: number }) => upd({ data: { ...v, quotation_id: q.id } }), onSuccess: onChange });
  const rmM  = useMutation({ mutationFn: (id: string) => rm({ data: { id, quotation_id: q.id } }), onSuccess: onChange });

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Line items</div>
          <div className="text-[15px] font-semibold">{q.items.length} item{q.items.length === 1 ? "" : "s"}</div>
        </div>
        {!readOnly && <AddItemDialog quotationId={q.id} onAdded={onChange} />}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px] text-right">Qty (m²)</TableHead>
            <TableHead className="w-[120px] text-right">Unit price</TableHead>
            <TableHead className="w-[120px] text-right">Line total</TableHead>
            {!readOnly && <TableHead className="w-[40px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {q.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={readOnly ? 4 : 5} className="h-24 text-center text-sm text-muted-foreground">
                No line items yet. Add products from inventory.
              </TableCell>
            </TableRow>
          )}
          {q.items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>
                <div className="text-[13px] font-medium">{it.description}</div>
                <div className="text-[11px] text-muted-foreground">{it.sku}</div>
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number" step="0.1"
                  defaultValue={Number(it.quantity)}
                  readOnly={readOnly}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== Number(it.quantity)) updM.mutate({ id: it.id, quantity: v });
                  }}
                  className="h-8 text-right tabular-nums"
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number" step="1"
                  defaultValue={Number(it.unit_price)}
                  readOnly={readOnly}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== Number(it.unit_price)) updM.mutate({ id: it.id, unit_price: v });
                  }}
                  className="h-8 text-right tabular-nums"
                />
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {currency(Number(it.line_total), q.currency)}
              </TableCell>
              {!readOnly && (
                <TableCell>
                  <button
                    onClick={() => rmM.mutate(it.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t border-border p-4 space-y-1.5">
        <TotalsRow label="Subtotal" value={currency(Number(q.subtotal), q.currency)} />
        <TotalsRow label={`Tax (${(Number(q.tax_rate) * 100).toFixed(1)}%)`} value={currency(Number(q.tax_amount), q.currency)} />
        <TotalsRow label="Total" value={currency(Number(q.total), q.currency)} emphasize />
      </div>
    </div>
  );
}

function TotalsRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", emphasize ? "text-[15px] font-semibold pt-2 border-t border-border" : "text-[13px] text-muted-foreground")}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// -------- Add item dialog --------
function AddItemDialog({ quotationId, onAdded }: { quotationId: string; onAdded: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [qty, setQty] = useState(10);
  const { data: products } = useSuspenseQuery(productsWithStockOptions());
  const add = useServerFn(addQuotationItem);
  const addM = useMutation({
    mutationFn: (product_id: string) => add({ data: { quotation_id: quotationId, product_id, quantity: qty } }),
    onSuccess: async () => { await onAdded(); setOpen(false); },
  });

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return products.filter((p) =>
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.color_family.toLowerCase().includes(query),
    ).slice(0, 20);
  }, [products, q]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle>Add product from inventory</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input placeholder="Search catalogue…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9" />
          <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-9 w-24" />
          <span className="grid place-items-center text-[11px] text-muted-foreground">m²</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border rounded-lg border border-border">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addM.mutate(p.id)}
              className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-surface-muted"
              disabled={addM.isPending}
            >
              <div className="h-9 w-9 rounded-md" style={{ background: p.hero_gradient }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{p.sku} · {p.finish} · {p.thickness_mm}mm</div>
              </div>
              <div className="text-[12px] tabular-nums">{currency(Number(p.list_price_per_m2))}/m²</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No products match.</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------- PDF preview --------
function PdfPreview({ q }: { q: import("@/lib/quotations-queries").QuotationWithItems }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">PDF preview</div>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => window.print()}>
          <FileDown className="h-3.5 w-3.5" /> Export
        </Button>
      </div>
      <div className="p-5 space-y-4 text-[12px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[15px] font-semibold tracking-tight">Arquane OS</div>
            <div className="text-muted-foreground text-[11px]">Via del Marmo 24, Livorno, IT</div>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-semibold">{q.number}</div>
            <div className="text-[11px] text-muted-foreground">Issued {fmtDate(q.created_at)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] pt-3 border-t border-border">
          <div>
            <div className="uppercase tracking-wider text-muted-foreground mb-1">Bill to</div>
            <div className="text-foreground font-medium">{q.customer_company ?? q.customer_name}</div>
            <div className="text-muted-foreground">{q.customer_name}</div>
            <div className="text-muted-foreground">{q.customer_country}</div>
          </div>
          <div>
            <div className="uppercase tracking-wider text-muted-foreground mb-1">Terms</div>
            <div>{q.incoterm}</div>
            <div className="text-muted-foreground">Valid until {fmtDate(q.valid_until)}</div>
            <div className="text-muted-foreground">Currency {q.currency}</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="uppercase tracking-wider text-muted-foreground mb-2 text-[11px]">Items</div>
          <div className="divide-y divide-border">
            {q.items.map((it) => (
              <div key={it.id} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium truncate">{it.description}</div>
                  <div className="text-[11px] text-muted-foreground">{it.sku} · {Number(it.quantity)} m² × {currency(Number(it.unit_price), q.currency)}</div>
                </div>
                <div className="tabular-nums text-[12px] font-medium">{currency(Number(it.line_total), q.currency)}</div>
              </div>
            ))}
            {q.items.length === 0 && <div className="py-6 text-center text-muted-foreground text-[11px]">No items yet</div>}
          </div>
        </div>

        <div className="pt-3 border-t border-border space-y-1">
          <TotalsRow label="Subtotal" value={currency(Number(q.subtotal), q.currency)} />
          <TotalsRow label={`Tax (${(Number(q.tax_rate) * 100).toFixed(1)}%)`} value={currency(Number(q.tax_amount), q.currency)} />
          <TotalsRow label="Total" value={currency(Number(q.total), q.currency)} emphasize />
        </div>

        {q.notes && (
          <div className="pt-3 border-t border-border">
            <div className="uppercase tracking-wider text-muted-foreground mb-1 text-[11px]">Notes</div>
            <div className="text-[11px] text-muted-foreground whitespace-pre-wrap">{q.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------- Timeline --------
function Timeline({ events }: { events: import("@/lib/quotations-queries").QuotationEvent[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Activity</div>
      </div>
      <div className="p-4 space-y-3">
        {events.length === 0 && <div className="text-[12px] text-muted-foreground">No activity yet.</div>}
        {events.map((e) => (
          <div key={e.id} className="flex items-start gap-3">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px]">{e.message}</div>
              <div className="text-[11px] text-muted-foreground">
                {e.actor} · {new Date(e.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3 flex items-start gap-2 bg-canvas rounded-b-xl">
        <Sparkles className="h-3.5 w-3.5 text-accent mt-0.5" />
        <div className="text-[11px] text-muted-foreground">
          <span className="text-foreground font-medium">Quote coach:</span> sending will reserve matching slabs automatically. Consider offering a bundled shipping quote if the container fill exceeds 60%.
        </div>
      </div>
    </div>
  );
}

// Silence unused-var lint for tree-shaken helpers.
void Package;
