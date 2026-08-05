import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Filter,
  Flame,
  Globe2,
  LayoutGrid,
  Mail,
  Phone,
  Search,
  Sparkles,
  Table as TableIcon,
  UserPlus,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Arquane OS" },
      { name: "description", content: "Global lead pipeline for the natural stone and quartz industry with AI enrichment and buying-power scoring." },
      { property: "og:title", content: "Leads — Arquane OS" },
      { property: "og:description", content: "Global lead pipeline for the natural stone and quartz industry with AI enrichment and buying-power scoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadsPage,
});

type LeadStage = "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation";

interface Lead {
  id: string;
  company: string;
  contact: string;
  role: string;
  country: string;
  flag: string;
  industry: string;
  source: string;
  score: number;
  value: number;
  stage: LeadStage;
  lastTouch: string;
  owner: string;
  ownerInitials: string;
  aiHint: string;
}

const LEADS: Lead[] = [
  { id: "L-2041", company: "Mediterraneo Marmi S.p.A.", contact: "Alessandro Ricci", role: "Procurement Director", country: "Italy", flag: "🇮🇹", industry: "Distributor", source: "Import records", score: 94, value: 480000, stage: "Negotiation", lastTouch: "2h ago", owner: "Sofia Marin", ownerInitials: "SM", aiHint: "Send Calacatta Gold quote — matches 3 prior orders." },
  { id: "L-2039", company: "Granito Andes Ltda.", contact: "Camila Rojas", role: "CEO", country: "Chile", flag: "🇨🇱", industry: "Fabricator", source: "Website", score: 88, value: 265000, stage: "Proposal", lastTouch: "Yesterday", owner: "David Ono", ownerInitials: "DO", aiHint: "Propose FOB Callao — 18% cheaper vs. current supplier." },
  { id: "L-2036", company: "Emirates Stone Trading LLC", contact: "Yusuf Al-Farsi", role: "Head of Sourcing", country: "UAE", flag: "🇦🇪", industry: "Distributor", source: "Trade show", score: 91, value: 620000, stage: "Qualified", lastTouch: "3d ago", owner: "Sofia Marin", ownerInitials: "SM", aiHint: "High buying power — schedule discovery call this week." },
  { id: "L-2034", company: "Nordic Surfaces AB", contact: "Ingrid Lindqvist", role: "Category Manager", country: "Sweden", flag: "🇸🇪", industry: "Retail chain", source: "LinkedIn", score: 82, value: 190000, stage: "Contacted", lastTouch: "5d ago", owner: "Priya Nair", ownerInitials: "PN", aiHint: "Send Nordic-themed lookbook (light quartz series)." },
  { id: "L-2031", company: "Pacific Stoneworks", contact: "Ethan Walker", role: "Owner", country: "USA", flag: "🇺🇸", industry: "Fabricator", source: "Referral", score: 76, value: 145000, stage: "New", lastTouch: "1w ago", owner: "David Ono", ownerInitials: "DO", aiHint: "Verify port of entry — likely Los Angeles / Long Beach." },
  { id: "L-2028", company: "Casablanca Marbre", contact: "Nadia Bennani", role: "Managing Director", country: "Morocco", flag: "🇲🇦", industry: "Distributor", source: "Import records", score: 84, value: 305000, stage: "Qualified", lastTouch: "2d ago", owner: "Priya Nair", ownerInitials: "PN", aiHint: "Similar profile to Tunis Marbre — bundle 3 containers." },
  { id: "L-2025", company: "Sydney Slab Co.", contact: "Oliver Bennett", role: "Head of Buying", country: "Australia", flag: "🇦🇺", industry: "Distributor", source: "Email campaign", score: 71, value: 210000, stage: "Contacted", lastTouch: "4d ago", owner: "Sofia Marin", ownerInitials: "SM", aiHint: "Long lead time — quote CIF Sydney with 60-day terms." },
  { id: "L-2022", company: "Tokyo Ishi Design", contact: "Haruki Sato", role: "Design Principal", country: "Japan", flag: "🇯🇵", industry: "Architect", source: "Referral", score: 79, value: 98000, stage: "Proposal", lastTouch: "6h ago", owner: "David Ono", ownerInitials: "DO", aiHint: "Prefers matte finishes — attach honed-surface catalog." },
];

const STAGES: LeadStage[] = ["New", "Contacted", "Qualified", "Proposal", "Negotiation"];

const STAGE_STYLES: Record<LeadStage, string> = {
  New: "bg-muted text-muted-foreground",
  Contacted: "bg-info/10 text-info border-info/20",
  Qualified: "bg-accent/15 text-accent-foreground border-accent/30",
  Proposal: "bg-primary/10 text-primary border-primary/20",
  Negotiation: "bg-success/10 text-success border-success/20",
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function ScoreDot({ score }: { score: number }) {
  const tone = score >= 85 ? "text-success" : score >= 75 ? "text-accent" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-1.5">
      <Flame className={cn("h-3.5 w-3.5", tone)} />
      <span className={cn("text-xs font-semibold tabular-nums", tone)}>{score}</span>
    </div>
  );
}

function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <Badge variant="outline" className={cn("border font-medium", STAGE_STYLES[stage])}>
      {stage}
    </Badge>
  );
}

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return LEADS;
    return LEADS.filter(
      (l) =>
        l.company.toLowerCase().includes(q) ||
        l.contact.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q),
    );
  }, [query]);

  const kpis = [
    { label: "Open leads", value: LEADS.length, hint: "8 new this week" },
    { label: "Weighted pipeline", value: currency(LEADS.reduce((s, l) => s + l.value, 0)), hint: "+12.4% MoM" },
    { label: "Avg. lead score", value: Math.round(LEADS.reduce((s, l) => s + l.score, 0) / LEADS.length), hint: "Healthy" },
    { label: "Countries", value: new Set(LEADS.map((l) => l.country)).size, hint: "4 continents" },
  ];

  return (
    <AppShell
      title="Leads"
      subtitle="Scored global pipeline enriched with import history and AI recommendations."
      actions={
        <>
          <Button size="sm" variant="outline">
            <Filter className="mr-1.5 h-4 w-4" /> Filters
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <UserPlus className="mr-1.5 h-4 w-4" /> New lead
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

      <Card className="mt-6 border-accent/30 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 shadow-sm">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">AI recommendation</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              3 high-score leads in MENA match your Calacatta Gold surplus inventory (12 slabs, Port of Livorno). Estimated close rate 68%.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-accent/40 text-accent hover:bg-accent/10">
            Review batch <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, contact, country…"
            className="pl-9"
          />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="table"><TableIcon className="mr-1.5 h-3.5 w-3.5" /> Table</TabsTrigger>
            <TabsTrigger value="kanban"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={view} className="mt-4">
        <TabsContent value="table" className="mt-0">
          <Card className="border-border/60 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[26%]">Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Last touch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{l.company}</div>
                          <div className="truncate text-xs text-muted-foreground">{l.industry} · {l.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{l.contact}</div>
                      <div className="text-xs text-muted-foreground">{l.role}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{l.flag} {l.country}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.source}</TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-foreground">{currency(l.value)}</TableCell>
                    <TableCell><ScoreDot score={l.score} /></TableCell>
                    <TableCell><StageBadge stage={l.stage} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{l.ownerInitials}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{l.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{l.lastTouch}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="mt-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {STAGES.map((stage) => {
              const items = filtered.filter((l) => l.stage === stage);
              const total = items.reduce((s, l) => s + l.value, 0);
              return (
                <div key={stage} className="flex min-w-0 flex-col rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StageBadge stage={stage} />
                      <span className="text-xs text-muted-foreground">{items.length}</span>
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{currency(total)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((l) => (
                      <Card key={l.id} className="border-border/60 bg-card shadow-sm transition hover:shadow-md">
                        <CardContent className="space-y-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground">{l.company}</div>
                              <div className="truncate text-xs text-muted-foreground">{l.flag} {l.country} · {l.industry}</div>
                            </div>
                            <ScoreDot score={l.score} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium tabular-nums text-foreground">{currency(l.value)}</span>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">{l.ownerInitials}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex items-start gap-1.5 rounded-md bg-accent/10 p-2 text-[11px] text-foreground/80">
                            <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                            <span className="line-clamp-2">{l.aiHint}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Globe2 className="h-4 w-4 text-primary" /> Recent enrichment activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          {[
            { icon: Mail, text: "Verified email address for Yusuf Al-Farsi (Emirates Stone Trading)", time: "12m ago" },
            { icon: Phone, text: "Added direct line for Camila Rojas (Granito Andes)", time: "1h ago" },
            { icon: Globe2, text: "Matched Mediterraneo Marmi against 18 import shipments (2022–2025)", time: "3h ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-muted text-muted-foreground">
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <span className="flex-1 text-foreground/80">{a.text}</span>
              <span className="text-xs text-muted-foreground">{a.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
