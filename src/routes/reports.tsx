import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BarChart3, TrendingUp, DollarSign, Package, Ship, Users, Sparkles,
  Trophy, AlertTriangle, Target,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { quotationsListOptions, currency } from "@/lib/quotations-queries";
import { projectsListOptions, PROJECT_STATUS_LABEL } from "@/lib/projects-queries";
import { shipmentsListOptions, STATUS_LABEL as SHIP_LABEL } from "@/lib/shipping-queries";
import { productsWithStockOptions, aggregateProduct } from "@/lib/inventory-queries";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Arquane OS" },
      { name: "description", content: "Executive analytics across sales, quotations, production, inventory and logistics." },
      { property: "og:title", content: "Reports — Arquane OS" },
      { property: "og:description", content: "Executive analytics across sales, quotations, production, inventory and logistics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(quotationsListOptions());
    context.queryClient.ensureQueryData(projectsListOptions());
    context.queryClient.ensureQueryData(shipmentsListOptions());
    context.queryClient.ensureQueryData(productsWithStockOptions());
  },
  errorComponent: ({ error }) => (
    <AppShell title="Reports"><div role="alert" className="text-sm text-destructive">{error.message}</div></AppShell>
  ),
  notFoundComponent: () => <AppShell title="Reports"><div>Not found.</div></AppShell>,
  component: ReportsPage,
});

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

function ReportsPage() {
  const { data: quotations } = useSuspenseQuery(quotationsListOptions());
  const { data: projects } = useSuspenseQuery(projectsListOptions());
  const { data: shipments } = useSuspenseQuery(shipmentsListOptions());
  const { data: products } = useSuspenseQuery(productsWithStockOptions());

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const openValue = quotations
      .filter((q) => ["draft", "in_review", "sent"].includes(q.status))
      .reduce((s, q) => s + Number(q.total ?? 0), 0);
    const wonValue = quotations
      .filter((q) => q.status === "accepted")
      .reduce((s, q) => s + Number(q.total ?? 0), 0);
    const decided = quotations.filter((q) => q.status === "accepted" || q.status === "rejected").length;
    const winRate = decided ? (quotations.filter((q) => q.status === "accepted").length / decided) * 100 : 0;
    const activeProjects = projects.filter((p) => !["completed", "shipped"].includes(p.status)).length;
    const inTransit = shipments.filter((s) => s.status === "in_transit").length;
    const freight = shipments.reduce((s, r) => s + Number(r.freight_cost ?? 0), 0);
    const inventoryUnits = products.reduce((s, p) => s + aggregateProduct(p).available, 0);
    return { openValue, wonValue, winRate, activeProjects, inTransit, freight, inventoryUnits };
  }, [quotations, projects, shipments, products]);

  // ---------- Revenue over time (by month, last 6 months) ----------
  const revenueSeries = useMemo(() => {
    const months: { key: string; label: string; won: number; pipeline: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: d.toLocaleDateString("en-US", { month: "short" }), won: 0, pipeline: 0 });
    }
    for (const q of quotations) {
      const d = q.created_at ? new Date(q.created_at) : null;
      if (!d) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.key === key);
      if (!bucket) continue;
      const total = Number(q.total ?? 0);
      if (q.status === "accepted") bucket.won += total;
      if (["draft", "in_review", "sent"].includes(q.status)) bucket.pipeline += total;
    }
    return months;
  }, [quotations]);

  // ---------- Quotation status split ----------
  const quotationStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of quotations) map.set(q.status, (map.get(q.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [quotations]);

  // ---------- Production stages ----------
  const productionStages = useMemo(() => {
    const stages = ["queued", "slabbing", "cutting", "polishing", "qc", "packaging", "ready"];
    const counts: Record<string, number> = Object.fromEntries(stages.map((s) => [s, 0]));
    for (const p of projects) for (const w of p.work_orders ?? []) if (w.stage in counts) counts[w.stage]++;
    return stages.map((s) => ({ stage: s.charAt(0).toUpperCase() + s.slice(1), count: counts[s] }));
  }, [projects]);

  // ---------- Shipments by status ----------
  const shipmentStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shipments) map.set(s.status, (map.get(s.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([status, count]) => ({ status: SHIP_LABEL[status] ?? status, count }));
  }, [shipments]);

  // ---------- Top customers by won value ----------
  const topCustomers = useMemo(() => {
    const map = new Map<string, { pipeline: number; won: number }>();
    for (const q of quotations) {
      const key = q.customer_name ?? "—";
      const cur = map.get(key) ?? { pipeline: 0, won: 0 };
      const total = Number(q.total ?? 0);
      if (q.status === "accepted") cur.won += total;
      else if (["draft", "in_review", "sent"].includes(q.status)) cur.pipeline += total;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([customer, v]) => ({ customer, ...v, total: v.won + v.pipeline }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [quotations]);

  // ---------- Inventory health ----------
  const inventoryHealth = useMemo(() => {
    const buckets = { "In stock": 0, "Low stock": 0, "Reserved": 0, "Out of stock": 0 };
    for (const p of products) {
      const a = aggregateProduct(p);
      if (a.level === "in-stock") buckets["In stock"]++;
      else if (a.level === "low-stock") buckets["Low stock"]++;
      else if (a.level === "reserved") buckets["Reserved"]++;
      else buckets["Out of stock"]++;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <AppShell
      title="Reports"
      subtitle="Executive analytics across sales, quotations, production, inventory and logistics."
    >
      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Won revenue" value={currency(kpis.wonValue)} sub="Accepted quotations" icon={Trophy} tone="success" />
        <Kpi label="Open pipeline" value={currency(kpis.openValue)} sub="Draft · Review · Sent" icon={TrendingUp} />
        <Kpi label="Win rate" value={`${kpis.winRate.toFixed(0)}%`} sub="Accepted ÷ Decided" icon={Target} />
        <Kpi label="Freight spend" value={currency(kpis.freight)} sub={`${kpis.inTransit} in transit`} icon={Ship} />
        <Kpi label="Active projects" value={String(kpis.activeProjects)} sub={`${projects.length} lifetime`} icon={Package} />
        <Kpi label="Available slabs" value={String(kpis.inventoryUnits)} sub={`${products.length} SKUs`} icon={BarChart3} />
        <Kpi label="Quotations" value={String(quotations.length)} sub="All statuses" icon={DollarSign} />
        <Kpi label="Customers" value={String(new Set(quotations.map((q) => q.customer_name)).size)} sub="With quotes" icon={Users} />
      </div>

      {/* AI insights */}
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Insight
          icon={Sparkles}
          tone="accent"
          title="Best-performing month"
          body={(() => {
            const best = [...revenueSeries].sort((a, b) => b.won - a.won)[0];
            return best && best.won > 0 ? `${best.label} led with ${currency(best.won)} in won revenue.` : "No won revenue yet in the last 6 months.";
          })()}
        />
        <Insight
          icon={AlertTriangle}
          tone="warning"
          title="Inventory attention"
          body={`${inventoryHealth.find((b) => b.name === "Low stock")?.value ?? 0} products low, ${inventoryHealth.find((b) => b.name === "Out of stock")?.value ?? 0} out of stock.`}
        />
        <Insight
          icon={Trophy}
          tone="success"
          title="Top account"
          body={topCustomers[0] ? `${topCustomers[0].customer} — ${currency(topCustomers[0].total)} total value` : "No customer data yet."}
        />
      </div>

      {/* Charts row 1 */}
      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card title="Revenue trend" subtitle="Won vs. open pipeline (last 6 months)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="won" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => currency(v)}
                />
                <Area type="monotone" dataKey="won" name="Won" stroke="hsl(var(--primary))" fill="url(#won)" strokeWidth={2} />
                <Area type="monotone" dataKey="pipeline" name="Pipeline" stroke="hsl(var(--accent))" fill="url(#pipe)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Inventory health" subtitle="Products by stock level">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryHealth} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2}>
                  {inventoryHealth.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card title="Production throughput" subtitle="Work orders by stage">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionStages} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Shipments by status" subtitle="Logistics distribution">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shipmentStatus} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom row: top customers + status split */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Top customers" subtitle="By total quotation value">
          <div className="divide-y divide-border">
            {topCustomers.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No customer data yet.</div>
            )}
            {topCustomers.map((c) => {
              const max = topCustomers[0]?.total || 1;
              const wonPct = (c.won / max) * 100;
              const pipePct = (c.pipeline / max) * 100;
              return (
                <div key={c.customer} className="py-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.customer}</span>
                    <span className="tabular-nums text-muted-foreground">{currency(c.total)}</span>
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="bg-primary" style={{ width: `${wonPct}%` }} />
                    <div className="bg-accent" style={{ width: `${pipePct}%` }} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Won {currency(c.won)}</span>
                    <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Pipeline {currency(c.pipeline)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Quotation status" subtitle="Volume by lifecycle stage">
          <div className="space-y-2">
            {quotationStatus.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No quotations yet.</div>
            )}
            {quotationStatus.map((q) => {
              const max = Math.max(...quotationStatus.map((x) => x.count), 1);
              return (
                <div key={q.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{q.status.replace("_", " ")}</span>
                    <span className="tabular-nums text-muted-foreground">{q.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(q.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {projects.length} projects tracked · statuses: {[...new Set(projects.map((p) => PROJECT_STATUS_LABEL[p.status] ?? p.status))].join(" · ") || "—"}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({
  label, value, sub, icon: Icon, tone,
}: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className={cn("h-4 w-4", tone === "success" && "text-success", tone === "warning" && "text-warning", !tone && "text-muted-foreground")} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="mb-3">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Insight({
  icon: Icon, title, body, tone,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string; tone: "accent" | "warning" | "success" }) {
  const toneClass =
    tone === "accent" ? "border-accent/30 bg-accent/5 text-accent-foreground"
      : tone === "warning" ? "border-warning/30 bg-warning/5 text-warning"
      : "border-success/30 bg-success/5 text-success";
  return (
    <div className={cn("rounded-lg border p-3", toneClass)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="mt-1.5 text-sm text-foreground">{body}</div>
    </div>
  );
}
