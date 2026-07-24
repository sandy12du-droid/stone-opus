import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Factory, Clock, ChevronRight, User, ArrowRight, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  productionBoardOptions, PRODUCTION_STAGES, STAGE_LABEL, STAGE_TONE,
  PRIORITY_TONE, fmtDate,
} from "@/lib/projects-queries";
import { advanceWorkOrder } from "@/lib/projects.functions";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Production — Arquane OS" },
      { name: "description", content: "Live production board for stone fabrication — queued to shipped." },
      { property: "og:title", content: "Production — Arquane OS" },
      { property: "og:description", content: "Live fabrication board across slabbing, cutting, polishing, QC, packaging and shipping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productionBoardOptions()),
  errorComponent: ({ error }) => (
    <AppShell title="Production"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Production"><div>Not found.</div></AppShell>,
  component: ProductionBoard,
});

type BoardRow = Awaited<ReturnType<NonNullable<ReturnType<typeof productionBoardOptions>["queryFn"]>>>[number];
type WorkOrder = BoardRow & { project?: { id: string; code: string; name: string; priority: string } | null };

function ProductionBoard() {
  const { data: rows } = useSuspenseQuery(productionBoardOptions());
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const grouped = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    PRODUCTION_STAGES.forEach((s) => (map[s] = []));
    (rows as WorkOrder[]).forEach((w) => { (map[w.stage] ??= []).push(w); });
    return map;
  }, [rows]);

  const kpis = useMemo(() => {
    const r = rows as WorkOrder[];
    const open = r.filter((w) => w.status !== "completed");
    const overdue = open.filter((w) => w.due_date && new Date(w.due_date) < new Date()).length;
    const inFab = open.filter((w) => ["slabbing", "cutting", "polishing"].includes(w.stage)).length;
    const readyOrShipped = r.filter((w) => ["ready", "shipped"].includes(w.stage)).length;
    return { total: r.length, open: open.length, overdue, inFab, readyOrShipped };
  }, [rows]);

  return (
    <AppShell title="Production" subtitle="Live fabrication board — from slabbing to shipping.">
      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Open work orders" value={kpis.open} sub={`${kpis.total} total`} icon={Factory} />
        <Kpi label="In fabrication" value={kpis.inFab} icon={Clock} />
        <Kpi label="Ready / shipped" value={kpis.readyOrShipped} icon={ArrowRight} tone="success" />
        <Kpi label="Overdue" value={kpis.overdue} icon={AlertTriangle} tone={kpis.overdue > 0 ? "warning" : undefined} />
      </div>

      <div className="mb-4 flex items-center gap-1">
        <button onClick={() => setView("kanban")} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", view === "kanban" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted")}>Kanban</button>
        <button onClick={() => setView("list")} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", view === "list" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted")}>List</button>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PRODUCTION_STAGES.map((stage) => (
            <div key={stage} className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", STAGE_TONE[stage])}>
                  {STAGE_LABEL[stage]}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{grouped[stage].length}</span>
              </div>
              <div className="flex flex-col gap-2 p-2">
                {grouped[stage].length === 0 && (
                  <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Empty</div>
                )}
                {grouped[stage].map((wo) => <WorkOrderCard key={wo.id} wo={wo} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ListView rows={rows as WorkOrder[]} />
      )}
    </AppShell>
  );
}

function Kpi({ label, value, sub, icon: Icon, tone }:
  { label: string; value: number; sub?: string; icon: React.ComponentType<{ className?: string }>; tone?: "warning" | "success" }) {
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

function WorkOrderCard({ wo }: { wo: WorkOrder }) {
  const qc = useQueryClient();
  const advance = useServerFn(advanceWorkOrder);
  const mut = useMutation({
    mutationFn: advance,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["production"] }),
  });
  const idx = PRODUCTION_STAGES.indexOf(wo.stage as typeof PRODUCTION_STAGES[number]);
  const next = PRODUCTION_STAGES[idx + 1];
  const overdue = wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed";
  const project = (wo as WorkOrder & { project?: { id: string; code: string; name: string; priority: string } }).project;
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{wo.title}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{wo.code} · {wo.quantity} {wo.unit}</div>
        </div>
        {project && (
          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium", PRIORITY_TONE[project.priority])}>{project.priority}</span>
        )}
      </div>
      {project && (
        <Link
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          className="mt-2 block truncate text-xs text-primary hover:underline"
        >
          {project.name}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {wo.assigned_to && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {wo.assigned_to}</span>}
        {wo.due_date && (
          <span className={cn("flex items-center gap-1", overdue && "text-destructive font-medium")}>
            <Clock className="h-3 w-3" /> {fmtDate(wo.due_date)}
          </span>
        )}
      </div>
      {next && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 h-7 w-full text-xs"
          disabled={mut.isPending}
          onClick={() => mut.mutate({ data: { id: wo.id, to_stage: next } })}
        >
          → {STAGE_LABEL[next]} <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function ListView({ rows }: { rows: WorkOrder[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">Work order</th>
            <th className="px-4 py-2 text-left">Project</th>
            <th className="px-4 py-2 text-left">Stage</th>
            <th className="px-4 py-2 text-left">Assigned</th>
            <th className="px-4 py-2 text-left">Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((wo) => {
            const project = (wo as WorkOrder & { project?: { id: string; code: string; name: string; priority: string } }).project;
            const overdue = wo.due_date && new Date(wo.due_date) < new Date() && wo.status !== "completed";
            return (
              <tr key={wo.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-2">
                  <div className="font-medium text-foreground">{wo.title}</div>
                  <div className="text-xs text-muted-foreground">{wo.code}</div>
                </td>
                <td className="px-4 py-2">
                  {project && (
                    <Link to="/projects/$projectId" params={{ projectId: project.id }} className="text-primary hover:underline">
                      {project.name}
                    </Link>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", STAGE_TONE[wo.stage] ?? STAGE_TONE.queued)}>
                    {STAGE_LABEL[wo.stage] ?? wo.stage}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{wo.assigned_to ?? "—"}</td>
                <td className={cn("px-4 py-2", overdue && "text-destructive font-medium")}>{fmtDate(wo.due_date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
