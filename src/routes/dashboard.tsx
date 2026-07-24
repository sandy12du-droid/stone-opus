import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  FileText,
  Package,
  Factory,
  Ship,
  DollarSign,
  CheckSquare,
  Users,
  Sparkles,
  Plus,
  Upload,
  Boxes,
  MoreHorizontal,
  Circle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Arquane OS" },
      { name: "description", content: "Executive dashboard for stone business operations." },
      { property: "og:title", content: "Dashboard — Arquane OS" },
      { property: "og:description", content: "Executive dashboard for stone business operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

/* ------------------------------------------------------------------ */
/* Placeholder data                                                    */
/* ------------------------------------------------------------------ */

const kpis = [
  { label: "Revenue pipeline", value: "$4.82M", delta: "+12.4%", trend: "up", hint: "vs. last 30 days", icon: DollarSign },
  { label: "Open quotations", value: "38", delta: "+6", trend: "up", hint: "awaiting approval", icon: FileText },
  { label: "Today's leads", value: "17", delta: "+3", trend: "up", hint: "4 unassigned", icon: UserPlus },
  { label: "Inventory alerts", value: "9", delta: "+2", trend: "down", hint: "SKUs below threshold", icon: Package },
  { label: "Production active", value: "24", delta: "on-time", trend: "flat", hint: "6 due this week", icon: Factory },
  { label: "Containers ready", value: "5", delta: "+1", trend: "up", hint: "cleared for dispatch", icon: Ship },
  { label: "Tasks due", value: "12", delta: "3 overdue", trend: "down", hint: "assigned to you", icon: CheckSquare },
  { label: "Customer follow-ups", value: "21", delta: "+4", trend: "up", hint: "next 7 days", icon: Users },
] as const;

const pipelineData = [
  { month: "Jan", pipeline: 2.1, closed: 1.2 },
  { month: "Feb", pipeline: 2.4, closed: 1.4 },
  { month: "Mar", pipeline: 2.9, closed: 1.7 },
  { month: "Apr", pipeline: 3.1, closed: 1.9 },
  { month: "May", pipeline: 3.6, closed: 2.2 },
  { month: "Jun", pipeline: 3.4, closed: 2.4 },
  { month: "Jul", pipeline: 4.0, closed: 2.7 },
  { month: "Aug", pipeline: 4.2, closed: 2.9 },
  { month: "Sep", pipeline: 4.5, closed: 3.1 },
  { month: "Oct", pipeline: 4.4, closed: 3.3 },
  { month: "Nov", pipeline: 4.7, closed: 3.5 },
  { month: "Dec", pipeline: 4.82, closed: 3.7 },
];

const productionData = [
  { stage: "Slabbing", jobs: 8 },
  { stage: "Cutting", jobs: 12 },
  { stage: "Polishing", jobs: 6 },
  { stage: "QC", jobs: 4 },
  { stage: "Packing", jobs: 3 },
];

const activities = [
  { who: "Elena Voss", what: "approved quotation", target: "Q-2418 · Riverside Kitchens", time: "12m ago", tone: "success" as const },
  { who: "David Chen", what: "added 24 slabs to", target: "Calacatta Oro — Warehouse B", time: "34m ago", tone: "info" as const },
  { who: "System", what: "flagged low stock on", target: "Statuario Extra 20mm (3 slabs)", time: "1h ago", tone: "warning" as const },
  { who: "Aisha Rahman", what: "created lead", target: "Concord Stoneworks · TX", time: "2h ago", tone: "info" as const },
  { who: "Marco Silva", what: "dispatched container", target: "CNT-0091 · MSC Loreto", time: "3h ago", tone: "success" as const },
  { who: "Priya Nair", what: "uploaded shop drawing", target: "PRJ-118 · Ashford Residence", time: "5h ago", tone: "info" as const },
];

const followUps = [
  { name: "Riverside Kitchens", country: "United States", value: "$184k", due: "Today", stage: "Negotiation" },
  { name: "Alba Marmi", country: "Italy", value: "$92k", due: "Tomorrow", stage: "Quote sent" },
  { name: "Doha Interiors", country: "Qatar", value: "$310k", due: "Fri", stage: "Sample review" },
  { name: "Concord Stoneworks", country: "United States", value: "$47k", due: "Mon", stage: "Discovery" },
];

const recommendations = [
  { title: "3 warm leads have not been contacted in 5+ days", cta: "Review leads" },
  { title: "Container CNT-0092 can consolidate 4 pending POs", cta: "Preview loading plan" },
  { title: "Quartz demand in Texas up 18% MoM — enrich importer list", cta: "Open segment" },
];

/* ------------------------------------------------------------------ */

function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Executive overview of sales, inventory, production, and shipping."
      actions={
        <>
          <Button variant="outline" size="sm">Last 30 days</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Export report
          </Button>
        </>
      }
    >
      {/* Quick actions */}
      <QuickActions />

      {/* KPI grid */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </section>

      {/* Charts row */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Revenue pipeline</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Weighted pipeline vs. closed-won · trailing 12 months</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <LegendDot color="var(--color-primary)" label="Pipeline" />
              <LegendDot color="var(--color-accent)" label="Closed" />
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPipe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  cursor={{ stroke: "var(--color-border-strong)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 12,
                    boxShadow: "var(--shadow-elev-2)",
                  }}
                  formatter={(v: number) => [`$${v.toFixed(2)}M`, ""]}
                />
                <Area type="monotone" dataKey="pipeline" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gPipe)" />
                <Area type="monotone" dataKey="closed" stroke="var(--color-accent)" strokeWidth={2} fill="url(#gClose)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-foreground">Production status</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Active jobs by stage</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-surface-muted)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 12,
                    boxShadow: "var(--shadow-elev-2)",
                  }}
                />
                <Bar dataKey="jobs" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* AI recommendations */}
      <section className="mt-6 card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-[13px] font-semibold">AI recommendations</h3>
            <span className="chip">3 new</span>
          </div>
          <Link to="/ai" className="text-xs font-medium text-primary hover:underline">
            Open Command Center →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {recommendations.map((r) => (
            <div
              key={r.title}
              className="group flex flex-col justify-between gap-4 rounded-lg border border-border bg-surface-muted/40 p-4 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <p className="text-[13px] leading-relaxed text-foreground/90">{r.title}</p>
              <button className="inline-flex w-fit items-center gap-1 text-xs font-medium text-primary transition-colors group-hover:gap-1.5">
                {r.cta}
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: activity + follow-ups */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card-surface lg:col-span-3 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Recent activity</h3>
            <button className="text-xs font-medium text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <ul className="divide-y divide-border">
            {activities.map((a, i) => (
              <li key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <ToneDot tone={a.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground">
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-medium">{a.target}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold">Customer follow-ups</h3>
            <Link to="/crm/customers" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              CRM →
            </Link>
          </div>
          <ul className="space-y-2">
            {followUps.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-foreground">{f.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {f.country} · {f.stage}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold text-foreground">{f.value}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">Due {f.due}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function QuickActions() {
  const actions = [
    { label: "Create lead", icon: UserPlus, to: "/crm/leads" as const },
    { label: "Create quotation", icon: FileText, to: "/quotations" as const },
    { label: "Upload drawing", icon: Upload, to: "/projects" as const },
    { label: "Add inventory", icon: Boxes, to: "/inventory/products" as const },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.label}
            to={a.to}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            <Icon className="h-3.5 w-3.5 text-primary" />
            {a.label}
          </Link>
        );
      })}
      <div className="ml-auto inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <Plus className="h-3.5 w-3.5" />
        Configure widgets
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Circle;
  return (
    <div className="card-surface p-4 transition-shadow hover:shadow-[var(--shadow-elev-2)]">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-tight text-foreground">{value}</span>
        <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", trendColor)}>
          <TrendIcon className={cn("h-3 w-3", trend === "flat" && "fill-current")} />
          {delta}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function ToneDot({ tone }: { tone: "success" | "info" | "warning" }) {
  const color =
    tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-info";
  return <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", color)} />;
}
