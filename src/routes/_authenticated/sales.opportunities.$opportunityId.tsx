import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Users,
  Video,
} from "lucide-react";
import type { ComponentType } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_TIMELINE,
  FOLLOWUPS,
  SALES_STAGES,
  currencyFmt,
  getOpportunity,
  type Activity,
  type Opportunity,

} from "@/lib/sales-data";
import { StageBadge } from "@/components/sales/StageBadge";

export const Route = createFileRoute("/_authenticated/sales/opportunities/$opportunityId")({
  loader: ({ params }) => {
    const opp = getOpportunity(params.opportunityId);
    if (!opp) throw notFound();
    return { opp };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Opportunity not found — Arquane OS" }, { name: "robots", content: "noindex" }] };
    }
    const { opp } = loaderData;
    const title = `${opp.name} — Arquane OS`;
    const desc = `${opp.customer} · ${opp.stage} · ${currencyFmt(opp.value, opp.currency)}. Full 360° view: contacts, quotations, activity, tasks and AI recommendations.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <AppShell title="Something went wrong">
      <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Opportunity not found">
      <p className="text-sm text-muted-foreground">
        This opportunity may have been archived.{" "}
        <Link to="/sales/opportunities" className="text-primary hover:underline">Return to list</Link>.
      </p>
    </AppShell>
  ),
  component: OpportunityDetailPage,
});

function OpportunityDetailPage() {
  const { opp } = Route.useLoaderData() as { opp: Opportunity };
  const activities = ACTIVITY_TIMELINE[opp.id] ?? DEFAULT_ACTIVITIES;
  const followups = FOLLOWUPS[opp.id] ?? DEFAULT_FOLLOWUPS;
  const stageIdx = SALES_STAGES.indexOf(opp.stage);
  const weighted = (opp.value * opp.probability) / 100;

  return (
    <AppShell>
      {/* Back */}
      <div className="mb-4">
        <Link
          to="/sales/opportunities"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Opportunities
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StageBadge stage={opp.stage} />
            <span className="text-[11px] font-medium text-muted-foreground">{opp.id}</span>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">{opp.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {opp.customer}
            </span>
            <span>·</span>
            <span>{opp.flag} {opp.country}</span>
            <span>·</span>
            <span>{opp.industry}</span>
            <span>·</span>
            <span>Source: {opp.source}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Mail className="mr-1.5 h-4 w-4" /> Log Email</Button>
          <Button variant="outline" size="sm"><Phone className="mr-1.5 h-4 w-4" /> Log Call</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <FileText className="mr-1.5 h-4 w-4" /> New Quote
          </Button>
        </div>
      </div>

      {/* Metric strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Value" value={currencyFmt(opp.value, opp.currency)} />
        <MetricTile label="Weighted" value={currencyFmt(weighted, opp.currency)} accent />
        <MetricTile label="Probability" value={`${opp.probability}%`} />
        <MetricTile label="Expected Close" value={opp.expectedClose} />
      </div>

      {/* Stage tracker */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-foreground">Sales Workflow</div>
            <div className="text-[11px] text-muted-foreground">
              Next step: <span className="font-medium text-foreground">{opp.nextStep}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {SALES_STAGES.map((s, i) => {
              const done = i < stageIdx;
              const current = i === stageIdx;
              return (
                <div key={s} className="flex flex-1 min-w-[92px] items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold",
                      done && "border-primary bg-primary text-primary-foreground",
                      current && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                      !done && !current && "border-border bg-muted text-muted-foreground",
                    )}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div className={cn(
                      "text-center text-[10px] font-medium leading-tight",
                      current ? "text-foreground" : "text-muted-foreground",
                    )}>
                      {s}
                    </div>
                  </div>
                  {i < SALES_STAGES.length - 1 && (
                    <div className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: tabs */}
        <div className="space-y-5 lg:col-span-2">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList>
              <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-[14px] font-semibold">Communication Log</CardTitle>
                  <Button variant="ghost" size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Log activity</Button>
                </CardHeader>
                <CardContent>
                  <ol className="relative space-y-4 border-l border-border pl-5">
                    {activities.map((a) => {
                      const Icon = ACTIVITY_ICON[a.type];
                      return (
                        <li key={a.id} className="relative">
                          <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="text-[13px] font-medium text-foreground">{a.title}</div>
                            <div className="text-[11px] text-muted-foreground">{a.at}</div>
                          </div>
                          {a.detail && (
                            <div className="mt-0.5 text-[12px] text-muted-foreground">{a.detail}</div>
                          )}
                          <div className="mt-0.5 text-[11px] text-muted-foreground">by {a.actor}</div>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emails" className="mt-4">
              <EmptyPanel icon={Mail} title="Email history" hint="Connect Gmail or Outlook to sync full thread history." />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <EmptyPanel icon={StickyNote} title="Meeting notes" hint="Capture meeting notes here — AI will summarize and extract action items." />
            </TabsContent>
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {followups.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 p-3">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-foreground">{f.title}</div>
                        <div className="text-[11px] text-muted-foreground">Due {f.due} · {f.owner}</div>
                      </div>
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                        f.status === "overdue" && "border-destructive/20 bg-destructive/10 text-destructive",
                        f.status === "done" && "border-success/20 bg-success/10 text-success",
                        f.status === "upcoming" && "border-warning/20 bg-warning/10 text-warning",
                      )}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="docs" className="mt-4">
              <EmptyPanel icon={Paperclip} title="Documents" hint="Drawings, contracts and quotations attached to this opportunity will appear here." />
            </TabsContent>
          </Tabs>

          {/* Quote request / status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold">Quotation & Order Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatusTile label="Quote Request" value={opp.quotationRef ?? "Not started"} tone={opp.quotationRef ? "ok" : "muted"} />
              <StatusTile label="Sales Order" value={opp.orderRef ?? "Pending"} tone={opp.orderRef ? "ok" : "muted"} />
              <StatusTile label="Project" value={opp.projectRef ?? "—"} tone={opp.projectRef ? "ok" : "muted"} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* AI recommendations */}
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <CardTitle className="text-[13px] font-semibold">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[12px]">
              {opp.aiSignal && (
                <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                  {opp.aiSignal.text}
                </div>
              )}
              <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                Bundle Calacatta Oro with matching Statuario island top — historical attach rate 62%.
              </div>
              <div className="rounded-md bg-background/60 p-2.5 text-foreground/80">
                Best contact window for {opp.contacts[0]?.name}: Tue–Thu, 09:00–11:00 local.
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[13px] font-semibold">Contact Persons</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {opp.contacts.map((c) => (
                <div key={c.email} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                      {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[12px] font-semibold text-foreground">{c.name}</div>
                      {c.primary && (
                        <span className="rounded-sm bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.role}</div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</div>
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Owner + tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold">Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                    {opp.owner.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{opp.owner.name}</div>
                  <div className="text-[11px] text-muted-foreground">Account Owner</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {opp.tags.map((t) => (
                  <span key={t} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 space-y-1 text-[11px] text-muted-foreground">
                <div>Created {opp.createdAt}</div>
                <div>Last activity {opp.lastActivity}</div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-[13px] font-semibold">Follow-ups</CardTitle>
              <Button variant="ghost" size="sm"><Plus className="h-3.5 w-3.5" /></Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {followups.map((f) => (
                <div key={f.id} className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-foreground">{f.title}</div>
                    <div className="text-[11px] text-muted-foreground">{f.due} · {f.owner}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

const ACTIVITY_ICON: Record<Activity["type"], ComponentType<{ className?: string }>> = {
  email: Mail,
  call: Phone,
  meeting: Video,
  note: StickyNote,
  quote: FileText,
  stage: CheckCircle2,
  task: MessageSquare,
};

const DEFAULT_ACTIVITIES: Activity[] = [
  { id: "d1", type: "note", title: "Opportunity created", actor: "System", at: "just now" },
];
const DEFAULT_FOLLOWUPS = [
  { id: "d1", title: "Schedule discovery call", due: "This week", owner: "Unassigned", status: "upcoming" as const },
];

function MetricTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border p-3",
      accent ? "border-accent/30 bg-accent/5" : "border-border bg-card",
    )}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-[16px] font-semibold tracking-tight", accent ? "text-accent" : "text-foreground")}>
        {value}
      </div>
    </div>
  );
}

function StatusTile({ label, value, tone }: { label: string; value: string; tone: "ok" | "muted" }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn(
        "mt-1 text-[13px] font-semibold",
        tone === "ok" ? "text-primary" : "text-muted-foreground",
      )}>
        {value}
      </div>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, hint }: { icon: ComponentType<{ className?: string }>; title: string; hint: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-3 text-[13px] font-semibold text-foreground">{title}</div>
        <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">{hint}</p>
        <Button size="sm" variant="outline" className="mt-4"><Send className="mr-1.5 h-3.5 w-3.5" /> Get started</Button>
      </CardContent>
    </Card>
  );
}
