import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Filter,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  OPPORTUNITIES,
  SALES_STAGES,
  currencyFmt,
  type SalesStage,
} from "@/lib/sales-data";
import { StageBadge } from "@/components/sales/StageBadge";

export const Route = createFileRoute("/sales/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Arquane OS" },
      { name: "description", content: "Global opportunity management: filterable list, sales forecast, win/loss analysis, and quotation/order status." },
      { property: "og:title", content: "Opportunities — Arquane OS" },
      { property: "og:description", content: "Global opportunity management: filterable list, sales forecast, win/loss analysis, and quotation/order status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

const OWNERS = ["All owners", "Priya Ravi", "Marcus Ford", "Arjun Mehta", "Isabella Conti"] as const;
const STAGE_FILTERS: ("All stages" | SalesStage)[] = ["All stages", ...SALES_STAGES];

function OpportunitiesPage() {
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState<(typeof OWNERS)[number]>("All owners");
  const [stage, setStage] = useState<(typeof STAGE_FILTERS)[number]>("All stages");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return OPPORTUNITIES.filter((o) => {
      if (owner !== "All owners" && o.owner.name !== owner) return false;
      if (stage !== "All stages" && o.stage !== stage) return false;
      if (!needle) return true;
      return (
        o.name.toLowerCase().includes(needle) ||
        o.customer.toLowerCase().includes(needle) ||
        o.country.toLowerCase().includes(needle) ||
        o.id.toLowerCase().includes(needle)
      );
    });
  }, [q, owner, stage]);

  const forecast = useMemo(() => {
    const open = OPPORTUNITIES.filter((o) => o.stage !== "Completed");
    const commit = OPPORTUNITIES.filter((o) => ["Order Confirmed", "Production", "Shipping"].includes(o.stage));
    const bestCase = open.reduce((s, o) => s + o.value, 0);
    const weighted = open.reduce((s, o) => s + (o.value * o.probability) / 100, 0);
    const committed = commit.reduce((s, o) => s + o.value, 0);
    return { bestCase, weighted, committed };
  }, []);

  const stageBreakdown = useMemo(() => {
    return SALES_STAGES.map((s) => {
      const items = OPPORTUNITIES.filter((o) => o.stage === s);
      return {
        stage: s,
        count: items.length,
        value: items.reduce((sum, o) => sum + o.value, 0),
      };
    });
  }, []);
  const maxStageValue = Math.max(...stageBreakdown.map((s) => s.value), 1);

  return (
    <AppShell
      title="Opportunities"
      subtitle="Every deal, every stage, every forecast — the single source of truth for revenue."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New Opportunity
          </Button>
        </>
      }
    >
      {/* Forecast strip */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <ForecastCard
          label="Best Case"
          value={currencyFmt(forecast.bestCase, "USD")}
          sub="All open opportunities"
          trend={{ delta: "+12%", up: true }}
        />
        <ForecastCard
          label="Weighted Forecast"
          value={currencyFmt(forecast.weighted, "USD")}
          sub="Probability-adjusted"
          trend={{ delta: "+8%", up: true }}
          accent
        />
        <ForecastCard
          label="Committed"
          value={currencyFmt(forecast.committed, "USD")}
          sub="Order Confirmed → Shipping"
          trend={{ delta: "-3%", up: false }}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Stage breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stageBreakdown.map((s) => (
              <div key={s.stage} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <StageBadge stage={s.stage} />
                </div>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right text-[12px] font-semibold text-foreground">
                  {s.value > 0 ? currencyFmt(s.value, "USD") : "—"}
                </div>
                <div className="w-8 text-right text-[11px] text-muted-foreground">{s.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Win/Loss */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Win / Loss (Q4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-[24px] font-semibold text-primary">72%</div>
              <div className="text-[12px] text-muted-foreground">win rate</div>
            </div>
            <div className="mt-4 space-y-2 text-[12px]">
              <Row label="Deals won" value="18" tone="pos" />
              <Row label="Deals lost" value="7" tone="neg" />
              <Row label="Avg. sales cycle" value="42 days" />
              <Row label="Top loss reason" value="Price" tone="neg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search opportunity, customer, country, ID…"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value as (typeof OWNERS)[number])}
          className="h-9 rounded-md border border-input bg-background px-2.5 text-[12px]"
        >
          {OWNERS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as (typeof STAGE_FILTERS)[number])}
          className="h-9 rounded-md border border-input bg-background px-2.5 text-[12px]"
        >
          {STAGE_FILTERS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Button variant="outline" size="sm">
          <Filter className="mr-1.5 h-4 w-4" /> More
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Weighted</TableHead>
                <TableHead>Close</TableHead>
                <TableHead>Quote / Order</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      to="/sales/opportunities/$opportunityId"
                      params={{ opportunityId: o.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {o.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>{o.flag}</span> {o.customer} · {o.industry}
                    </div>
                  </TableCell>
                  <TableCell><StageBadge stage={o.stage} /></TableCell>
                  <TableCell className="text-right font-semibold">{currencyFmt(o.value, o.currency)}</TableCell>
                  <TableCell className="text-right text-primary">
                    {currencyFmt((o.value * o.probability) / 100, o.currency)}
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{o.expectedClose}</TableCell>
                  <TableCell className="text-[11px]">
                    {o.quotationRef && <div className="text-foreground/80">{o.quotationRef}</div>}
                    {o.orderRef && <div className="text-primary">{o.orderRef}</div>}
                    {!o.quotationRef && !o.orderRef && <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                          {o.owner.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[12px]">{o.owner.name}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-[13px] text-muted-foreground">
                    No opportunities match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function ForecastCard({
  label, value, sub, trend, accent,
}: { label: string; value: string; sub: string; trend: { delta: string; up: boolean }; accent?: boolean }) {
  const Icon = trend.up ? TrendingUp : TrendingDown;
  return (
    <Card className={cn(accent && "border-accent/30 bg-accent/5")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            trend.up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
          )}>
            <Icon className="h-3 w-3" /> {trend.delta}
          </div>
        </div>
        <div className={cn("mt-2 text-[24px] font-semibold tracking-tight", accent ? "text-accent" : "text-foreground")}>
          {value}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        "font-semibold",
        tone === "pos" && "text-emerald-600",
        tone === "neg" && "text-rose-600",
        !tone && "text-foreground",
      )}>{value}</span>
    </div>
  );
}
