import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Crown,
  Download,
  Filter,
  Globe2,
  Plus,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CUSTOMERS, TIER_STYLES, HEALTH_STYLES, currency, type Tier } from "@/lib/crm-data";


export const Route = createFileRoute("/crm/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Arquane OS" },
      { name: "description", content: "Global customer accounts with lifetime value, health signals, and reorder intelligence." },
      { property: "og:title", content: "Customers — Arquane OS" },
      { property: "og:description", content: "Global customer accounts with lifetime value, health signals, and reorder intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});


function CustomersPage() {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "All">("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return CUSTOMERS.filter((c) => {
      if (tierFilter !== "All" && c.tier !== tierFilter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
    });
  }, [query, tierFilter]);

  const totalLtv = CUSTOMERS.reduce((s, c) => s + c.ltv, 0);
  const totalYtd = CUSTOMERS.reduce((s, c) => s + c.ytd, 0);
  const atRisk = CUSTOMERS.filter((c) => c.health !== "Healthy").length;

  const kpis = [
    { label: "Active customers", value: CUSTOMERS.length, hint: "18 markets" },
    { label: "Portfolio LTV", value: currency(totalLtv), hint: "+9.6% YoY" },
    { label: "Revenue YTD", value: currency(totalYtd), hint: "68% of target" },
    { label: "Accounts at risk", value: atRisk, hint: "Attention needed" },
  ];

  const tiers: (Tier | "All")[] = ["All", "Platinum", "Gold", "Silver", "Emerging"];

  return (
    <AppShell
      title="Customers"
      subtitle="360° global accounts with health signals, lifetime value, and reorder intelligence."
      actions={
        <>
          <Button size="sm" variant="outline">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New customer
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Crown className="h-4 w-4 text-accent" /> Top accounts this quarter
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-5">
            {CUSTOMERS.slice(0, 4).map((c) => {
              const pct = Math.min(100, (c.ytd / 700000) * 100);
              return (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{c.flag}</span>
                      <span className="truncate font-medium text-foreground">{c.name}</span>
                      <Badge variant="outline" className={cn("border text-[10px]", TIER_STYLES[c.tier])}>{c.tier}</Badge>
                    </div>
                    <span className="tabular-nums font-medium text-foreground">{currency(c.ytd)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-accent" /> AI insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm">
            <div className="rounded-md border border-border/60 bg-card/60 p-3">
              <div className="text-xs font-semibold text-warning">Reorder likely</div>
              <p className="mt-1 text-xs text-foreground/80">Vittoria Stone Group typically reorders Calacatta Viola every 42 days. Due in 6 days.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-card/60 p-3">
              <div className="text-xs font-semibold text-destructive">Churn signal</div>
              <p className="mt-1 text-xs text-foreground/80">Berlin Stein Werk order frequency down 38% QoQ. Recommend account review.</p>
            </div>
            <div className="rounded-md border border-border/60 bg-card/60 p-3">
              <div className="text-xs font-semibold text-success">Upsell opportunity</div>
              <p className="mt-1 text-xs text-foreground/80">Al Habtoor Marble matches profile for premium Onyx line (est. +$180k).</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, countries…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition",
                tierFilter === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Card className="mt-4 border-border/60 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[24%]">Account</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">LTV</TableHead>
              <TableHead className="text-right">YTD</TableHead>
              <TableHead className="text-right">YoY</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    to="/crm/customers/$customerId"
                    params={{ customerId: c.id }}
                    className="flex items-center gap-2.5 -my-1 rounded-md py-1 pr-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">Prefers · {c.favorite}</div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="text-sm text-foreground">{c.flag} {c.country}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.segment}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border font-medium", TIER_STYLES[c.tier])}>{c.tier}</Badge>
                </TableCell>
                <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">{currency(c.ltv)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-foreground">{currency(c.ytd)}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                      c.yoy >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {c.yoy >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {c.yoy >= 0 ? "+" : ""}{c.yoy.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border font-medium", HEALTH_STYLES[c.health])}>{c.health}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{c.ownerInitials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{c.owner}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">{c.lastOrder}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  <Globe2 className="mx-auto mb-2 h-5 w-5 opacity-50" />
                  No customers match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
