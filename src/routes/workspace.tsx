import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckSquare,
  UserPlus,
  FileText,
  Factory,
  Sparkles,
  Calendar as CalendarIcon,
  Bell,
  ArrowUpRight,
  Send,
  Command as CommandIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { openCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Arquane OS" },
      { name: "description", content: "Your daily operating surface for the stone business — tasks, leads, quotations, production, AI." },
      { property: "og:title", content: "Workspace — Arquane OS" },
      { property: "og:description", content: "Your daily operating surface for the stone business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const tasks = [
  { title: "Approve Q-2418 · Riverside Kitchens", due: "Today", tone: "warning" as const },
  { title: "Call back Doha Interiors on sample review", due: "Today", tone: "info" as const },
  { title: "Sign off container CNT-0092 loading plan", due: "Tomorrow", tone: "info" as const },
  { title: "Review pricing floor for Calacatta Oro", due: "Fri", tone: "success" as const },
];

const leads = [
  { name: "Concord Stoneworks", country: "United States · TX", stage: "Discovery", value: "$47k" },
  { name: "Alba Marmi", country: "Italy", stage: "Quote sent", value: "$92k" },
  { name: "Nordic Slab Co.", country: "Sweden", stage: "New", value: "$61k" },
];

const quotations = [
  { id: "Q-2418", client: "Riverside Kitchens", status: "Awaiting approval", value: "$184k" },
  { id: "Q-2417", client: "Doha Interiors", status: "Sample review", value: "$310k" },
  { id: "Q-2415", client: "Alba Marmi", status: "Sent", value: "$92k" },
];

const production = [
  { job: "PRJ-118 · Ashford Residence", stage: "Polishing", pct: 68 },
  { job: "PRJ-121 · Marina Tower L28", stage: "Cutting", pct: 42 },
  { job: "PRJ-115 · Verdi Hospitality", stage: "QC", pct: 91 },
];

const aiSuggestions = [
  "3 warm leads have not been contacted in 5+ days — draft outreach?",
  "Container CNT-0092 can consolidate 4 pending POs — preview loading plan.",
  "Quartz demand in Texas up 18% MoM — enrich importer list.",
];

const calendar = [
  { time: "10:30", title: "Standup · Production floor", where: "Livorno" },
  { time: "13:00", title: "Riverside Kitchens · Quote review", where: "Zoom" },
  { time: "16:00", title: "FX hedge check-in with finance", where: "Internal" },
];

const notifications = [
  { text: "Elena Voss approved Q-2418", time: "12m", tone: "success" as const },
  { text: "Statuario Extra 20mm below threshold", time: "1h", tone: "warning" as const },
  { text: "Container CNT-0091 dispatched", time: "3h", tone: "info" as const },
];

const promptStarters = [
  "Summarize this week's pipeline",
  "Draft follow-up for Doha Interiors",
  "What's slowing down PRJ-121?",
];

function WorkspacePage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Arquane OS · Workspace
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">
              {greeting()}, Sanjay
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what needs your attention today.
            </p>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Ask Arquane AI */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-elev-1)]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Ask Arquane AI anything about your business…"
              className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={openCommandPalette}
              className="hidden items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] text-muted-foreground hover:border-border-strong sm:inline-flex"
            >
              <CommandIcon className="h-3 w-3" /> K
            </button>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">
              <Send className="h-3.5 w-3.5" /> Ask
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {promptStarters.map((p) => (
              <button
                key={p}
                className="rounded-full border border-border bg-surface-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace grid */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WorkspaceCard title="Today's Tasks" icon={CheckSquare} to="/reports" count={tasks.length}>
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.title} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <ToneDot tone={t.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-foreground">{t.title}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{t.due}</span>
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="New Leads" icon={UserPlus} to="/crm/leads" count={leads.length}>
          <ul className="space-y-2">
            {leads.map((l) => (
              <li key={l.name} className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground">{l.country} · {l.stage}</div>
                </div>
                <div className="text-[12px] font-semibold">{l.value}</div>
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="Open Quotations" icon={FileText} to="/quotations" count={quotations.length}>
          <ul className="space-y-2">
            {quotations.map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{q.id} · {q.client}</div>
                  <div className="text-[11px] text-muted-foreground">{q.status}</div>
                </div>
                <div className="text-[12px] font-semibold">{q.value}</div>
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="Production" icon={Factory} to="/production" count={production.length}>
          <ul className="space-y-3">
            {production.map((p) => (
              <li key={p.job}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-[13px] font-medium">{p.job}</div>
                  <span className="chip text-[10px]">{p.stage}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="mt-1 text-right text-[10px] text-muted-foreground">{p.pct}%</div>
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="AI Suggestions" icon={Sparkles} to="/ai" count={aiSuggestions.length} accent>
          <ul className="space-y-2">
            {aiSuggestions.map((s) => (
              <li key={s} className="group flex items-start gap-2 rounded-md border border-border bg-surface-muted/40 p-3 transition-colors hover:border-border-strong hover:bg-surface-muted">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[12.5px] leading-relaxed text-foreground/90">{s}</p>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="Calendar" icon={CalendarIcon} to="/reports" count={calendar.length}>
          <ul className="divide-y divide-border">
            {calendar.map((c) => (
              <li key={c.title} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="w-12 shrink-0 text-[12px] font-semibold text-foreground">{c.time}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-foreground">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground">{c.where}</div>
                </div>
              </li>
            ))}
          </ul>
        </WorkspaceCard>

        <WorkspaceCard title="Notifications" icon={Bell} to="/reports" count={notifications.length} className="lg:col-span-3">
          <ul className="grid gap-2 md:grid-cols-3">
            {notifications.map((n) => (
              <li key={n.text} className="flex items-start gap-3 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5">
                <ToneDot tone={n.tone} />
                <div className="min-w-0 flex-1 text-[13px]">{n.text}</div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
              </li>
            ))}
          </ul>
        </WorkspaceCard>
      </section>
    </AppShell>
  );
}

function WorkspaceCard({
  title,
  icon: Icon,
  to,
  count,
  children,
  className,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("card-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            accent ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted-foreground",
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-[13px] font-semibold">{title}</h3>
          {typeof count === "number" && <span className="chip">{count}</span>}
        </div>
        <Link to={to} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Open →
        </Link>
      </div>
      {children}
    </div>
  );
}

function ToneDot({ tone }: { tone: "success" | "info" | "warning" }) {
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-info";
  return <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", color)} />;
}
