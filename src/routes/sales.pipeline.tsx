import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Filter,
  LayoutGrid,
  Plus,
  Rows3,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { OpportunityCard } from "@/components/sales/OpportunityCard";
import { StageBadge } from "@/components/sales/StageBadge";

export const Route = createFileRoute("/sales/pipeline")({
  head: () => ({
    meta: [
      { title: "Sales Pipeline — Arquane OS" },
      { name: "description", content: "Central sales workspace: Kanban and table views across every stage from New Lead to Completed, with forecast, probability, and AI signals." },
      { property: "og:title", content: "Sales Pipeline — Arquane OS" },
      { property: "og:description", content: "Central sales workspace: Kanban and table views across every stage from New Lead to Completed, with forecast, probability, and AI signals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return OPPORTUNITIES;
    return OPPORTUNITIES.filter(
      (o) =>
        o.name.toLowerCase().includes(needle) ||
        o.customer.toLowerCase().includes(needle) ||
        o.country.toLowerCase().includes(needle),
    );
  }, [q]);

  const totals = useMemo(() => {
    const open = filtered.filter((o) => o.stage !== "Completed");
    const pipelineValue = open.reduce((s, o) => s + o.value, 0);
    const weighted = open.reduce((s, o) => s + (o.value * o.probability) / 100, 0);
    const won = filtered
      .filter((o) => o.stage === "Completed")
      .reduce((s, o) => s + o.value, 0);
    const avgDeal =
      open.length > 0 ? Math.round(pipelineValue / open.length) : 0;
    return { pipelineValue, weighted, won, avgDeal, count: open.length };
  }, [filtered]);

  const stageGroups = useMemo(() => {
    const map = new Map<SalesStage, typeof OPPORTUNITIES>();
    SALES_STAGES.forEach((s) => map.set(s, []));
    filtered.forEach((o) => map.get(o.stage)?.push(o));
    return map;
  }, [filtered]);

  return (
    <AppShell
      title="Sales Pipeline"
      subtitle="Every opportunity from first touch to delivered order — one workspace."
      actions={
        <>
          <Button variant="outline" size="sm">
            <Filter className="mr-1.5 h-4 w-4" /> Filters
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New Opportunity
          </Button>
        </>
      }
    >
      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Open Pipeline" value={currencyFmt(totals.pipelineValue, "USD")} sub={`${totals.count} active`} />
        <KpiCard label="Weighted Forecast" value={currencyFmt(totals.weighted, "USD")} sub="Probability-adjusted" accent />
        <KpiCard label="Closed Won (YTD)" value={currencyFmt(totals.won, "USD")} sub="+18% vs LY" />
        <KpiCard label="Avg. Deal Size" value={currencyFmt(totals.avgDeal, "USD")} sub="Across open" />
      </div>

      {/* AI insight strip */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">AI Pipeline Coach</div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            3 opportunities in <span className="font-medium text-foreground">Quotation Sent</span> have stalled &gt;5 days —
            recommend phone follow-up. Marina Bay Residences shows high buying intent; prioritize a same-day response.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
          Review <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search opportunities, customer, country…"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
        <div className="flex items-center rounded-md border border-border bg-card p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
              view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
              view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Rows3 className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="-mx-2 overflow-x-auto pb-4">
          <div className="flex min-w-max gap-3 px-2">
            {SALES_STAGES.map((stage) => {
              const items = stageGroups.get(stage) ?? [];
              const total = items.reduce((s, o) => s + o.value, 0);
              return (
                <div key={stage} className="w-[260px] shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <StageBadge stage={stage} />
                      <span className="text-[11px] font-medium text-muted-foreground">{items.length}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-foreground/70">
                      {total > 0 ? currencyFmt(total, "USD") : "—"}
                    </span>
                  </div>
                  <div className="min-h-[120px] space-y-2 rounded-lg bg-muted/30 p-2">
                    {items.length === 0 ? (
                      <div className="flex h-24 items-center justify-center text-[11px] text-muted-foreground">
                        No opportunities
                      </div>
                    ) : (
                      items.map((o) => <OpportunityCard key={o.id} opp={o} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Prob.</TableHead>
                  <TableHead>Close</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        to="/sales/opportunities/$opportunityId"
                        params={{ opportunityId: o.id }}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {o.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">{o.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <span>{o.flag}</span> {o.customer}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{o.country}</div>
                    </TableCell>
                    <TableCell><StageBadge stage={o.stage} /></TableCell>
                    <TableCell className="text-right font-semibold">
                      {currencyFmt(o.value, o.currency)}
                    </TableCell>
                    <TableCell className="text-right text-primary">{o.probability}%</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{o.expectedClose}</TableCell>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className={cn(accent && "border-accent/30 bg-accent/5")}>
      <CardContent className="p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("mt-1.5 text-[20px] font-semibold tracking-tight", accent ? "text-accent" : "text-foreground")}>
          {value}
        </div>
        {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
