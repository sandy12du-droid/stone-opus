import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Calendar, Flag, Plus, ChevronRight, Package, User, Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  projectDetailOptions, PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE,
  PRIORITY_TONE, PRODUCTION_STAGES, STAGE_LABEL, STAGE_TONE,
  projectProgress, currency, fmtDate, PROJECT_STATUSES,
} from "@/lib/projects-queries";
import { addWorkOrder, advanceWorkOrder, updateProjectStatus } from "@/lib/projects.functions";

export const Route = createFileRoute("/projects/$projectId")({
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Project — Arquane OS" }, { name: "robots", content: "noindex" }] };
    }
    const p = loaderData;
    return {
      meta: [
        { title: `${p.name} — Projects · Arquane OS` },
        { name: "description", content: `Delivery workspace for ${p.name}.` },
        { property: "og:title", content: `${p.name} — Arquane OS` },
        { property: "og:description", content: `Production progress, work orders and delivery for ${p.name}.` },
      ],
    };
  },
  loader: async ({ params, context }) => {
    const p = await context.queryClient.ensureQueryData(projectDetailOptions(params.projectId));
    if (!p) throw notFound();
    return p;
  },
  errorComponent: ({ error }) => (
    <AppShell title="Project"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Project"><div className="text-sm text-muted-foreground">Project not found. <Link to="/projects" className="text-primary underline">Back to projects</Link></div></AppShell>
  ),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectDetailOptions(projectId));
  if (!project) return null;

  const qc = useQueryClient();
  const advance = useServerFn(advanceWorkOrder);
  const updateStatus = useServerFn(updateProjectStatus);
  const advanceMut = useMutation({
    mutationFn: advance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
  const statusMut = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const progress = projectProgress(project.work_orders.map((w) => w.stage));

  return (
    <AppShell title={project.name} subtitle={`${project.code}${project.po_number ? ` · ${project.po_number}` : ""}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm"><Link to="/projects"><ArrowLeft className="mr-1 h-4 w-4" /> All projects</Link></Button>
      </div>

      {/* Summary card */}
      <div className="mb-5 grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-4">
        <SummaryStat icon={User} label="Customer" value={project.customer_name ?? "—"} sub={project.customer_country ?? ""} />
        <SummaryStat icon={Calendar} label="Target delivery" value={fmtDate(project.target_delivery_date)} sub={project.start_date ? `Started ${fmtDate(project.start_date)}` : ""} />
        <SummaryStat icon={Flag} label="Priority" value={<span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_TONE[project.priority])}>{project.priority}</span>} />
        <SummaryStat icon={Package} label="Contract value" value={currency(Number(project.contract_value ?? 0), project.currency ?? "USD")} />
        <div className="md:col-span-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>Production progress</span>
            <span className="tabular-nums text-foreground">{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <select
              value={project.status}
              onChange={(e) => statusMut.mutate({ data: { id: project.id, status: e.target.value } })}
              className={cn("h-7 rounded-md border border-input bg-background px-2 text-xs font-medium", PROJECT_STATUS_TONE[project.status])}
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
              ))}
            </select>
            {project.notes && <span className="ml-3 text-xs text-muted-foreground">Note: {project.notes}</span>}
          </div>
        </div>
      </div>

      {/* Work orders */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Work orders</h2>
        <AddWorkOrderDialog projectId={project.id} />
      </div>

      <div className="space-y-3">
        {project.work_orders.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No work orders yet. Add one to begin fabrication tracking.
          </div>
        )}
        {project.work_orders.map((wo) => {
          const stageIdx = PRODUCTION_STAGES.indexOf(wo.stage as typeof PRODUCTION_STAGES[number]);
          const nextStage = PRODUCTION_STAGES[stageIdx + 1];
          return (
            <div key={wo.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{wo.title}</span>
                    <span className="text-xs text-muted-foreground">{wo.code}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{wo.quantity} {wo.unit}</span>
                    {wo.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {wo.assigned_to}</span>}
                    {wo.due_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {fmtDate(wo.due_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", STAGE_TONE[wo.stage] ?? STAGE_TONE.queued)}>
                    {STAGE_LABEL[wo.stage] ?? wo.stage}
                  </span>
                  {nextStage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={advanceMut.isPending}
                      onClick={() => advanceMut.mutate({ data: { id: wo.id, to_stage: nextStage } })}
                    >
                      Advance to {STAGE_LABEL[nextStage]} <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Stage rail */}
              <div className="mt-4 flex items-center gap-1 overflow-x-auto">
                {PRODUCTION_STAGES.map((s, i) => {
                  const done = i <= stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          done && !current && "border-primary/40 bg-primary/10 text-primary",
                          current && "border-primary bg-primary text-primary-foreground",
                          !done && "border-border bg-muted/40 text-muted-foreground",
                        )}
                      >
                        {STAGE_LABEL[s]}
                      </div>
                      {i < PRODUCTION_STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function SummaryStat({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function AddWorkOrderDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", quantity: "1", unit: "slab", assigned_to: "", due_date: "" });
  const qc = useQueryClient();
  const add = useServerFn(addWorkOrder);
  const mut = useMutation({
    mutationFn: add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setForm({ title: "", quantity: "1", unit: "slab", assigned_to: "", due_date: "" });
    },
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-1.5 h-4 w-4" /> Add work order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New work order</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid gap-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. CNC cutting & edging" />
          </div>
          <div className="grid gap-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Assigned to</Label><Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!form.title || mut.isPending}
            onClick={() => mut.mutate({ data: {
              project_id: projectId,
              title: form.title,
              quantity: Number(form.quantity) || 1,
              unit: form.unit || "slab",
              assigned_to: form.assigned_to || undefined,
              due_date: form.due_date || undefined,
            } })}
          >
            {mut.isPending ? "Adding…" : "Add work order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
