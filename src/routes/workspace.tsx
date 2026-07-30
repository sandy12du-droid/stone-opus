import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckSquare,
  UserPlus,
  Users,
  FileText,
  Upload,
  Boxes,
  Container as ContainerIcon,
  Sparkles,
  BarChart3,
  Send,
  Command as CommandIcon,
  Clock,
  Mail,
  Bell,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Flag,
  ArrowUpRight,
  Factory,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { openCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { SectionLabel, StatCard, ToneDot } from "@/components/shared";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Arquane OS" },
      { name: "description", content: "Your operating surface for the global natural stone business — focus, snapshot, AI, activity." },
      { property: "og:title", content: "Workspace — Arquane OS" },
      { property: "og:description", content: "Your operating surface for the global natural stone business." },
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

/* ------------------------------------------------------------------ */

const initialFocus = [
  { id: "1", label: "Follow up ABC Stone on Q-2418", done: false },
  { id: "2", label: "Approve 3 quotations", done: false },
  { id: "3", label: "Container CNT-0092 loading plan", done: false },
  { id: "4", label: "Production review with Livorno floor", done: false },
  { id: "5", label: "FX hedge check-in with finance", done: true },
];

const snapshot = [
  { label: "USA Orders", value: "$1.42M", delta: "+8.2%", trend: "up" as const, hint: "42 active · 6 shipping this wk", icon: Flag },
  { label: "Malaysia Inventory", value: "1,284", delta: "-3.1%", trend: "down" as const, hint: "slabs in Port Klang WH", icon: Boxes },
  { label: "Projects", value: "27", delta: "+2", trend: "up" as const, hint: "9 in fabrication", icon: Factory },
  { label: "Containers", value: "5", delta: "this wk", trend: "flat" as const, hint: "3 loading · 2 in transit", icon: ContainerIcon },
  { label: "Revenue Pipeline", value: "$4.82M", delta: "+12.4%", trend: "up" as const, hint: "weighted, next 90 days", icon: BarChart3 },
  { label: "Outstanding Payments", value: "$612k", delta: "9 overdue", trend: "down" as const, hint: "avg 14 days late", icon: AlertTriangle },
];

const quickActions = [
  { label: "New Lead", icon: UserPlus, to: "/crm/leads" as const },
  { label: "New Customer", icon: Users, to: "/crm/customers" as const },
  { label: "Create Quote", icon: FileText, to: "/quotations" as const },
  { label: "Upload Drawing", icon: Upload, to: "/projects" as const },
  { label: "Add Inventory", icon: Boxes, to: "/inventory/products" as const },
  { label: "Book Container", icon: ContainerIcon, to: "/shipping" as const },
  { label: "AI Research", icon: Sparkles, to: "/ai" as const },
  { label: "Open Reports", icon: BarChart3, to: "/reports" as const },
];

const myWork = [
  { label: "Pending Quotes", count: 8, tone: "info" as const, to: "/quotations" as const },
  { label: "Overdue Follow-ups", count: 3, tone: "warning" as const, to: "/crm/leads" as const },
  { label: "Today's Meetings", count: 4, tone: "info" as const, to: "/workspace" as const },
  { label: "Tasks Assigned", count: 12, tone: "info" as const, to: "/workspace" as const },
  { label: "Approvals Waiting", count: 5, tone: "warning" as const, to: "/quotations" as const },
  { label: "Production Alerts", count: 2, tone: "danger" as const, to: "/production" as const },
];

const aiExamples = [
  "Find importers in Florida",
  "Prepare quotation for Riverside Kitchens",
  "Show low inventory",
  "Calculate loading for CNT-0092",
  "Find delayed shipments",
];

const newLeads = [
  { name: "Concord Stoneworks", country: "United States · TX", value: "$47k" },
  { name: "Nordic Slab Co.", country: "Sweden", value: "$61k" },
  { name: "Al-Manar Interiors", country: "UAE", value: "$128k" },
];

const emails = [
  { from: "Elena Voss", subject: "Approved Q-2418", time: "12m" },
  { from: "Doha Interiors", subject: "Sample photos received", time: "1h" },
  { from: "MSC Logistics", subject: "CNT-0091 dispatched", time: "3h" },
];

const tasks = [
  { title: "Sign off pricing floor · Calacatta Oro", due: "Today" },
  { title: "Reply to Alba Marmi RFQ", due: "Today" },
  { title: "Review shop drawing · PRJ-118", due: "Tomorrow" },
];

const notifications = [
  { text: "Statuario Extra 20mm below threshold", tone: "warning" as const, time: "1h" },
  { text: "3 warm leads not contacted in 5+ days", tone: "warning" as const, time: "2h" },
  { text: "Q-2417 · Doha Interiors — sample review", tone: "info" as const, time: "4h" },
];

const meetings = [
  { time: "10:30", title: "Standup · Production floor", where: "Livorno" },
  { time: "13:00", title: "Riverside Kitchens · Quote review", where: "Zoom" },
  { time: "16:00", title: "FX hedge check-in", where: "Internal" },
];

/* ------------------------------------------------------------------ */

function WorkspacePage() {
  const [focus, setFocus] = useState(initialFocus);
  const toggle = (id: string) =>
    setFocus((f) => f.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <AppShell>
      {/* Greeting */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Arquane OS · Workspace
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            {greeting()}, Sanjay <span className="ml-0.5">👋</span>
          </h1>
          <div className="hidden text-right text-xs text-muted-foreground md:block">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mt-6">
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-3 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <a.icon className="h-3.5 w-3.5" />
              </div>
              <div className="text-[12.5px] font-medium text-foreground">+ {a.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Focus + My Work */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="card-surface lg:col-span-3 p-5">
          <SectionHeader
            title="Today's Focus"
            icon={CheckSquare}
            right={
              <span className="text-[11px] text-muted-foreground">
                {focus.filter((f) => f.done).length}/{focus.length} complete
              </span>
            }
          />
          <ul className="mt-3 divide-y divide-border">
            {focus.map((t) => (
              <li key={t.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    t.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border-strong bg-surface hover:border-primary",
                  )}
                  aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                >
                  {t.done && <CheckCircle2 className="h-3 w-3" />}
                </button>
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    t.done ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {t.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface lg:col-span-2 p-5">
          <SectionHeader title="My Work" icon={Timer} />
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {myWork.map((w) => (
              <li key={w.label}>
                <Link
                  to={w.to}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11.5px] text-muted-foreground">{w.label}</div>
                    <div
                      className={cn(
                        "text-[18px] font-semibold leading-tight",
                        w.tone === "danger"
                          ? "text-destructive"
                          : w.tone === "warning"
                            ? "text-warning"
                            : "text-foreground",
                      )}
                    >
                      {w.count}
                    </div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Business Snapshot */}
      <section className="mt-6">
        <SectionLabel>Business Snapshot</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {snapshot.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Arquane AI */}
      <section className="mt-6 rounded-xl border border-border bg-gradient-to-br from-primary/[0.04] to-transparent p-5 shadow-[var(--shadow-elev-1)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-[14px] font-semibold text-foreground">Arquane AI</h2>
          <span className="chip">beta</span>
          <Link
            to="/ai"
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Open Command Center →
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface p-2.5">
          <input
            type="text"
            placeholder="Ask anything about your business, inventory, customers, or shipments…"
            className="h-8 flex-1 bg-transparent px-2 text-[14px] outline-none placeholder:text-muted-foreground"
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

        <div className="mt-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Examples
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {aiExamples.map((p) => (
              <button
                key={p}
                className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-foreground/80 transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Activity */}
      <section className="mt-6">
        <SectionLabel>Today's Activity</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ActivityCard title="New Leads" icon={UserPlus} to="/crm/leads">
            <ul className="space-y-2">
              {newLeads.map((l) => (
                <li
                  key={l.name}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground">{l.country}</div>
                  </div>
                  <div className="text-[12px] font-semibold">{l.value}</div>
                </li>
              ))}
            </ul>
          </ActivityCard>

          <ActivityCard title="Recent Emails" icon={Mail} to="/documents">
            <ul className="divide-y divide-border">
              {emails.map((e) => (
                <li
                  key={e.subject}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{e.from}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {e.subject}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{e.time}</span>
                </li>
              ))}
            </ul>
          </ActivityCard>

          <ActivityCard title="Tasks" icon={CheckSquare} to="/reports">
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li
                  key={t.title}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-[13px] text-foreground">{t.title}</div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.due}</span>
                </li>
              ))}
            </ul>
          </ActivityCard>

          <ActivityCard title="Notifications" icon={Bell} to="/reports" className="lg:col-span-2">
            <ul className="grid gap-2 md:grid-cols-2">
              {notifications.map((n) => (
                <li
                  key={n.text}
                  className="flex items-start gap-3 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5"
                >
                  <ToneDot tone={n.tone} className="mt-1.5" />
                  <div className="min-w-0 flex-1 text-[13px]">{n.text}</div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                </li>
              ))}
            </ul>
          </ActivityCard>

          <ActivityCard title="Upcoming Meetings" icon={CalendarDays} to="/reports">
            <ul className="divide-y divide-border">
              {meetings.map((m) => (
                <li
                  key={m.title}
                  className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="w-12 shrink-0 text-[12px] font-semibold text-foreground">
                    {m.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">{m.where}</div>
                  </div>
                </li>
              ))}
            </ul>
          </ActivityCard>
        </div>
      </section>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */


function SectionHeader({
  title,
  icon: Icon,
  right,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      </div>
      {right}
    </div>
  );
}


function ActivityCard({
  title,
  icon: Icon,
  to,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-surface p-5", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-[13px] font-semibold">{title}</h3>
        </div>
        <Link to={to} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      {children}
    </div>
  );
}

