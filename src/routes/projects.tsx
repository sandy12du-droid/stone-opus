import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FolderKanban, Plus, Search, ArrowRight, Calendar, Flag,
  Package, TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  projectsListOptions, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE,
  PRIORITY_TONE, PRODUCTION_STAGES, projectProgress, currency, fmtDate,
  type ProjectStatus,
} from "@/lib/projects-queries";
import { createProject } from "@/lib/projects.functions";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Arquane OS" },
      { name: "description", content: "End-to-end project delivery from drawing to installation." },
      { property: "og:title", content: "Projects — Arquane OS" },
      { property: "og:description", content: "Live project portfolio with production progress and delivery risk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsListOptions()),
  errorComponent: ({ error }) => (
    <AppShell title="Projects"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Projects"><div>Not found.</div></AppShell>,
  component: ProjectsPage,
});

const STATUS_FILTERS: { key: "all" | ProjectStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "in_production", label: "In production" },
  { key: "qc", label: "QC" },
  { key: "ready_to_ship", label: "Ready to ship" },
  { key: "shipped", label: "Shipped" },
];

function ProjectsPage() {
  const { data: rows } = useSuspenseQuery(projectsListOptions());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return [r.code, r.name, r.customer_name, r.po_number]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [rows, query, status]);

  const kpis = useMemo(() => {
    const active = rows.filter((r) => !["completed", "shipped"].includes(r.status));
    const totalValue = rows.reduce((s, r) => s + Number(r.contract_value ?? 0), 0);
    const activeValue = active.reduce((s, r) => s + Number(r.contract_value ?? 0), 0);
    const critical = rows.filter((r) => r.priority === "critical").length;
    const dueSoon = rows.filter((r) => {
      if (!r.target_delivery_date) return false;
      const days = (new Date(r.target_delivery_date).getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 14 && !["completed", "shipped"].includes(r.status);
    }).length;
    return { count: rows.length, active: active.length, totalValue, activeValue, critical, dueSoon };
  }, [rows]);

  return (
    <AppShell title="Projects" subtitle="Portfolio delivery from award to installation.">
      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={FolderKanban} label="Active projects" value={String(kpis.active)} sub={`${kpis.count} total`} />
        <KpiCard icon={TrendingUp} label="Active value" value={currency(kpis.activeValue)} sub={`${currency(kpis.totalValue)} portfolio`} />
        <KpiCard icon={AlertTriangle} label="Critical priority" value={String(kpis.critical)} tone={kpis.critical > 0 ? "warning" : undefined} />
        <KpiCard icon={Calendar} label="Due in 14 days" value={String(kpis.dueSoon)} tone={kpis.dueSoon > 0 ? "warning" : undefined} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search projects, customers, PO…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatus(s.key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                status === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <NewProjectDialog />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Project</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-[220px]">Progress</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No projects match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const progress = projectProgress(p.work_orders.map((w) => w.stage));
              return (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.code}{p.po_number ? ` · ${p.po_number}` : ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{p.customer_name ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{p.customer_country ?? ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", PROJECT_STATUS_TONE[p.status])}>
                      {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_TONE[p.priority])}>
                      <Flag className="h-3 w-3" /> {p.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {p.work_orders.length} work orders
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {fmtDate(p.target_delivery_date)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {currency(Number(p.contract_value ?? 0), p.currency ?? "USD")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                        Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
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

function KpiCard({
  icon: Icon, label, value, sub, tone,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; tone?: "warning" | "success" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("h-4 w-4", tone === "warning" && "text-warning", tone === "success" && "text-success", !tone && "text-muted-foreground")} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", customer_name: "", customer_country: "",
    priority: "normal", po_number: "", contract_value: "",
    target_delivery_date: "",
  });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createProject);
  const mutation = useMutation({
    mutationFn: create,
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      navigate({ to: "/projects/$projectId", params: { projectId: row.id } });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid gap-1.5">
            <Label>Project name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Manhattan Tower — Lobby Cladding" />
          </div>
          <div className="grid gap-1.5">
            <Label>Customer</Label>
            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Country</Label>
            <Input value={form.customer_country} onChange={(e) => setForm({ ...form, customer_country: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>PO number</Label>
            <Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Priority</Label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Contract value (USD)</Label>
            <Input type="number" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Target delivery</Label>
            <Input type="date" value={form.target_delivery_date} onChange={(e) => setForm({ ...form, target_delivery_date: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!form.name || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                data: {
                  name: form.name,
                  customer_name: form.customer_name || undefined,
                  customer_country: form.customer_country || undefined,
                  priority: form.priority,
                  po_number: form.po_number || undefined,
                  contract_value: form.contract_value ? Number(form.contract_value) : undefined,
                  target_delivery_date: form.target_delivery_date || undefined,
                },
              })
            }
          >
            {mutation.isPending ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Suppress unused-import warnings for icons only used in future variants.
void Package; void CheckCircle2; void PRODUCTION_STAGES;
