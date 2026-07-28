import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Globe2,
  Factory,
  Ship,
  DollarSign,
  Target,
  Sparkles,
  ArrowUpRight,
  Flag,
  Gauge as GaugeIcon,
  CircleDot,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { EntityLink } from "@/components/EntityLink";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/executive")({
  head: () => ({
    meta: [
      { title: "Executive Workspace — Arquane OS" },
      { name: "description", content: "C-suite command view: portfolio health, risk radar, and decisions queue for Arquane OS." },
      { property: "og:title", content: "Executive Workspace — Arquane OS" },
      { property: "og:description", content: "C-suite command view for the natural stone business — portfolio, risk, and decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExecutiveWorkspacePage,
});

/* ------------------------------------------------------------------ */
/* Placeholder data                                                    */
/* ------------------------------------------------------------------ */

const northStars = [
  { label: "Net Revenue (QTD)", value: "$12.4M", target: "$14.0M", progress: 88, delta: "+9.2%", trend: "up" as const, icon: DollarSign },
  { label: "Gross Margin", value: "37.8%", target: "38%", progress: 99, delta: "+120bps", trend: "up" as const, icon: GaugeIcon },
  { label: "Win Rate", value: "42%", target: "45%", progress: 93, delta: "-1.4pt", trend: "down" as const, icon: Target },
  { label: "On-Time Ship", value: "94%", target: "96%", progress: 98, delta: "+2pt", trend: "up" as const, icon: Ship },
];

const trend = [
  { m: "Feb", rev: 2.8, plan: 3.0 },
  { m: "Mar", rev: 3.2, plan: 3.2 },
  { m: "Apr", rev: 3.4, plan: 3.4 },
  { m: "May", rev: 3.7, plan: 3.6 },
  { m: "Jun", rev: 3.9, plan: 3.8 },
  { m: "Jul", rev: 4.3, plan: 4.0 },
  { m: "Aug", rev: 4.1, plan: 4.2 },
  { m: "Sep", rev: 4.6, plan: 4.4 },
  { m: "Oct", rev: 4.9, plan: 4.6 },
  { m: "Nov", rev: 5.2, plan: 4.8 },
  { m: "Dec", rev: 5.4, plan: 5.0 },
  { m: "Jan", rev: 5.7, plan: 5.2 },
];

const regions = [
  { region: "United States", revenue: "$5.2M", share: 42, delta: "+11%", trend: "up" as const },
  { region: "Italy", revenue: "$2.4M", share: 19, delta: "+3%", trend: "up" as const },
  { region: "UAE / Qatar", revenue: "$1.8M", share: 15, delta: "+22%", trend: "up" as const },
  { region: "India", revenue: "$1.3M", share: 11, delta: "-4%", trend: "down" as const },
  { region: "Malaysia", revenue: "$0.9M", share: 7, delta: "flat", trend: "flat" as const },
  { region: "Rest of World", revenue: "$0.8M", share: 6, delta: "+6%", trend: "up" as const },
];

const risks = [
  {
    tone: "danger" as const,
    title: "FX exposure widening in EUR",
    detail: "€1.2M in open Italian POs unhedged. Every 1% move ≈ $14k hit to margin.",
    cta: "Open hedge plan",
  },
  {
    tone: "warning" as const,
    title: "Inventory concentration — Calacatta family",
    detail: "31% of Malaysia WH tied up in 3 SKUs. 62-day forward cover exceeds policy (45).",
    cta: "Review reallocation",
  },
  {
    tone: "warning" as const,
    title: "Container CNT-0088 delayed 6 days",
    detail: "MSC Loreto rerouted via Suez. Impacts 2 US customers with LDs on contracts.",
    cta: "Notify customers",
  },
  {
    tone: "info" as const,
    title: "Concentration risk — Riverside Kitchens",
    detail: "Top account = 14% of QTD revenue. Diversification target: <10%.",
    cta: "Open account plan",
  },
];

const decisions = [
  {
    title: "Approve capex — new bridge saw · Livorno",
    context: "Payback 2.1y at current throughput; unlocks +18% cut capacity.",
    owner: "You · CFO",
    due: "Today",
    tone: "primary" as const,
  },
  {
    title: "Sign off Q1 pricing floor",
    context: "3 slabs proposed +4%. Blended margin impact +80bps.",
    owner: "You",
    due: "Tomorrow",
    tone: "primary" as const,
  },
  {
    title: "Reappoint UAE distributor",
    context: "Al-Manar contract expires in 21 days. Renewal draft ready.",
    owner: "Legal → You",
    due: "This week",
    tone: "warning" as const,
  },
];

const topAccounts = [
  { id: "cust-riverside", name: "Riverside Kitchens", country: "United States", ytd: "$1.72M", trend: "up" as const },
  { id: "cust-alba", name: "Alba Marmi", country: "Italy", ytd: "$1.24M", trend: "up" as const },
  { id: "cust-doha", name: "Doha Interiors", country: "Qatar", ytd: "$0.98M", trend: "up" as const },
  { id: "cust-concord", name: "Concord Stoneworks", country: "United States", ytd: "$0.61M", trend: "flat" as const },
  { id: "cust-nordic", name: "Nordic Slab Co.", country: "Sweden", ytd: "$0.42M", trend: "down" as const },
];

const briefings = [
  "Pipeline coverage 3.1x quota — healthy, but skewed to <90-day close. Push 2 late-stage deals into commit.",
  "Malaysia WH aging: 214 slabs > 120 days. Bundle into a promo lane targeting UAE fabricators.",
  "Production floor OEE at 71% — Livorno polishing is the bottleneck. Consider swing shift next week.",
];

/* ------------------------------------------------------------------ */

function ExecutiveWorkspacePage() {
  return (
    <AppShell>
      {/* Header */}
      <section className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Arquane OS · Executive
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-foreground">
            Command view · Q1 FY26
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Where the business stands, what's at risk, and what only you can decide.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium hover:bg-surface-muted">
            This Quarter
          </button>
          <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium hover:bg-surface-muted">
            Export brief
          </button>
          <Link
            to="/workspace"
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-[12px] font-medium hover:bg-surface-muted"
          >
            Operator view
          </Link>
        </div>
      </section>

      {/* North stars */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {northStars.map((k) => (
          <NorthStar key={k.label} {...k} />
        ))}
      </section>

      {/* Trend + Regions */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-[13px] font-semibold">Revenue vs. Plan</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trailing 12 months · $M · plan = board-approved target
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <LegendDot color="var(--color-primary)" label="Revenue" />
              <LegendDot color="var(--color-muted-foreground)" label="Plan" />
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
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
                <Area type="monotone" dataKey="rev" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="plan" stroke="var(--color-muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Revenue by Region</h3>
          </div>
          <ul className="space-y-3">
            {regions.map((r) => (
              <li key={r.region}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-foreground">{r.region}</span>
                  <span className="text-muted-foreground">{r.revenue}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${r.share}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-14 text-right text-[11px] font-medium",
                      r.trend === "up"
                        ? "text-success"
                        : r.trend === "down"
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {r.delta}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Risk radar + Decisions queue */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card-surface lg:col-span-3 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Risk Radar</h3>
            <span className="chip">4 open</span>
          </div>
          <ul className="space-y-2">
            {risks.map((r) => (
              <li
                key={r.title}
                className="flex items-start gap-3 rounded-md border border-border bg-surface-muted/40 p-3 transition-colors hover:border-border-strong hover:bg-surface-muted"
              >
                <RiskDot tone={r.tone} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-foreground">{r.title}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{r.detail}</div>
                </div>
                <button className="shrink-0 text-[11.5px] font-medium text-primary hover:underline">
                  {r.cta} →
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface lg:col-span-2 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Flag className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Decisions Queue</h3>
            <span className="chip">{decisions.length}</span>
          </div>
          <ul className="space-y-2.5">
            {decisions.map((d) => (
              <li
                key={d.title}
                className={cn(
                  "rounded-md border p-3",
                  d.tone === "warning"
                    ? "border-warning/40 bg-warning/5"
                    : "border-border bg-surface-muted/40",
                )}
              >
                <div className="text-[13px] font-semibold text-foreground">{d.title}</div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">{d.context}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{d.owner}</span>
                  <span className="font-medium">{d.due}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground hover:bg-primary/90">
                    Approve
                  </button>
                  <button className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11.5px] font-medium hover:bg-surface-muted">
                    Defer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Operational gauges + Top accounts */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card-surface lg:col-span-2 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Factory className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Operational Health</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <GaugeCard value={71} label="OEE" tone="warning" />
            <GaugeCard value={94} label="On-time" tone="success" />
            <GaugeCard value={62} label="WH cover" tone="warning" suffix="d" />
          </div>
          <ul className="mt-4 space-y-2 text-[12px] text-muted-foreground">
            <li className="flex items-center gap-2">
              <CircleDot className="h-3 w-3 text-warning" />
              Polishing bottleneck at Livorno · 3 jobs queued
            </li>
            <li className="flex items-center gap-2">
              <CircleDot className="h-3 w-3 text-success" />
              QC pass rate stable at 97.4%
            </li>
            <li className="flex items-center gap-2">
              <CircleDot className="h-3 w-3 text-info" />
              2 containers loading, 3 booked next week
            </li>
          </ul>
        </div>

        <div className="card-surface lg:col-span-3 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-[13px] font-semibold">Top Accounts (YTD)</h3>
            </div>
            <Link to="/crm/customers" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              All customers →
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {topAccounts.map((a) => {
              const TrendIcon = a.trend === "up" ? TrendingUp : a.trend === "down" ? TrendingDown : ArrowUpRight;
              const trendColor = a.trend === "up" ? "text-success" : a.trend === "down" ? "text-destructive" : "text-muted-foreground";
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <EntityLink
                      entity={{ kind: "customer", id: a.id, name: a.name, sublabel: `Customer · ${a.country}` }}
                      className="truncate text-[13px] font-medium text-foreground hover:underline"
                    >
                      {a.name}
                    </EntityLink>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{a.country}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-foreground">{a.ytd}</span>
                    <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* AI Executive Briefing */}
      <section className="mt-6 rounded-xl border border-border bg-gradient-to-br from-primary/[0.05] to-transparent p-5 shadow-[var(--shadow-elev-1)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-[14px] font-semibold">Arquane AI · Executive Briefing</h2>
          <span className="chip">generated 8m ago</span>
          <Link to="/ai" className="ml-auto text-xs font-medium text-primary hover:underline">
            Open Command Center →
          </Link>
        </div>
        <ol className="mt-4 space-y-2.5">
          {briefings.map((b, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-border bg-surface p-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <p className="text-[13px] leading-relaxed text-foreground/90">{b}</p>
            </li>
          ))}
        </ol>
      </section>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */

function NorthStar({
  label,
  value,
  target,
  progress,
  delta,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  target: string;
  progress: number;
  delta: string;
  trend: "up" | "down" | "flat";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : ArrowUpRight;
  return (
    <div className="card-surface p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-tight">{value}</span>
        <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {delta}
        </span>
      </div>
      <div className="mt-3">
        <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Target {target}</span>
          <span>{progress}%</span>
        </div>
      </div>
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

function RiskDot({ tone }: { tone: "danger" | "warning" | "info" }) {
  const color =
    tone === "danger"
      ? "bg-destructive"
      : tone === "warning"
        ? "bg-warning"
        : "bg-info";
  const Icon = tone === "danger" ? AlertTriangle : tone === "warning" ? AlertTriangle : CircleDot;
  return (
    <span
      className={cn(
        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white",
        color,
      )}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

function GaugeCard({
  value,
  label,
  tone,
  suffix = "%",
}: {
  value: number;
  label: string;
  tone: "success" | "warning" | "danger";
  suffix?: string;
}) {
  const color =
    tone === "success"
      ? "var(--color-success)"
      : tone === "warning"
        ? "var(--color-warning)"
        : "var(--color-destructive)";
  const data = [{ name: label, value }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill={color} background={{ fill: "var(--color-surface-muted)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-foreground">
          {value}
          {suffix}
        </div>
      </div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{label}</div>
    </div>
  );
}
