import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Send,
  Command as CommandIcon,
  Zap,
  Clock,
  Bot,
  Lightbulb,
  BookMarked,
  Library,
  Activity as ActivityIcon,
  Plus,
  Search,
  FileText,
  Package,
  Users,
  Ship,
  BarChart3,
  Globe,
  Mail,
  ScrollText,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Bookmark,
  Paperclip,
  Mic,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { openCommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";
import { useBusinessContext } from "@/context/BusinessContext";
import { getAiSuggestions } from "@/lib/ai-context";


export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Arquane AI Command Center — Arquane OS" },
      { name: "description", content: "Command center for AI agents, prompts, knowledge, and insights across the stone business." },
      { property: "og:title", content: "Arquane AI Command Center — Arquane OS" },
      { property: "og:description", content: "Command center for AI agents, prompts, knowledge, and insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiCommandCenter,
});

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type SectionKey =
  | "chat"
  | "commands"
  | "tasks"
  | "agents"
  | "insights"
  | "prompts"
  | "knowledge"
  | "activity";

const sidebar: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
  { key: "chat", label: "Chat", icon: Sparkles },
  { key: "commands", label: "Quick Commands", icon: Zap, count: 8 },
  { key: "tasks", label: "Recent Tasks", icon: Clock, count: 6 },
  { key: "agents", label: "AI Agents", icon: Bot, count: 5 },
  { key: "insights", label: "Insights", icon: Lightbulb, count: 4 },
  { key: "prompts", label: "Saved Prompts", icon: BookMarked, count: 9 },
  { key: "knowledge", label: "Knowledge", icon: Library, count: 34 },
  { key: "activity", label: "Activity", icon: ActivityIcon },
];

const quickCommands = [
  { label: "Find importers in Florida", icon: Globe, category: "Research" },
  { label: "Prepare a quotation from RFQ", icon: FileText, category: "Sales" },
  { label: "Show low inventory across warehouses", icon: Package, category: "Inventory" },
  { label: "Calculate container loading plan", icon: Ship, category: "Logistics" },
  { label: "Find delayed shipments", icon: Ship, category: "Logistics" },
  { label: "Draft follow-up email to warm leads", icon: Mail, category: "Sales" },
  { label: "Summarize this week's pipeline", icon: BarChart3, category: "Reports" },
  { label: "Enrich lead: Concord Stoneworks", icon: Users, category: "CRM" },
];

const recentTasks = [
  { title: "Enriched 12 leads from Texas import list", status: "done" as const, when: "8m ago", agent: "Lead Enricher" },
  { title: "Drafted quotation Q-2418 · Riverside Kitchens", status: "done" as const, when: "34m ago", agent: "Quote Coach" },
  { title: "Loading plan for CNT-0092 (4 POs)", status: "running" as const, when: "just now", agent: "Logistics Planner" },
  { title: "Weekly pipeline summary", status: "done" as const, when: "2h ago", agent: "Sales Analyst" },
  { title: "Reprice signal for Statuario Extra", status: "review" as const, when: "3h ago", agent: "Pricing Advisor" },
  { title: "Translated shop drawing notes → IT", status: "done" as const, when: "5h ago", agent: "Docs Translator" },
];

const agents = AGENT_REGISTRY.map((a) => ({
  name: a.name,
  role: a.role,
  runs: a.runs30d,
  status: a.status,
}));

const insights = [
  { title: "Quartz demand in Texas up 18% MoM", body: "Enrich importer list and prioritize 4 warm accounts.", tone: "opportunity" as const },
  { title: "9 overdue invoices totaling $612k", body: "Alba Marmi and 2 others avg. 21 days late.", tone: "risk" as const },
  { title: "Container CNT-0092 can consolidate 4 pending POs", body: "Preview a loading plan to cut freight by ~11%.", tone: "opportunity" as const },
  { title: "Calacatta Oro margin is 4pts below floor", body: "Reprice list by $18/sqft or extend hedge.", tone: "risk" as const },
];

const savedPrompts = [
  { title: "Draft cold outreach to US kitchen fabricators", tag: "Sales" },
  { title: "Explain HS codes for a stone shipment to EU", tag: "Logistics" },
  { title: "Compare landed cost across Livorno/Newark/Chennai", tag: "Pricing" },
  { title: "Write onboarding email for a new customer", tag: "CRM" },
  { title: "Turn shop drawing PDF into a cut list", tag: "Production" },
  { title: "Summarize this account's last 12 months", tag: "CRM" },
  { title: "Suggest bundles for a $150k quotation", tag: "Sales" },
  { title: "Weekly digest: pipeline, inventory, shipping", tag: "Reports" },
  { title: "Draft a payment reminder — polite, firm", tag: "Finance" },
];

const knowledge = [
  { title: "Arquane price book — 2025 Q3", type: "Doc", size: "1.2 MB" },
  { title: "Incoterms cheat sheet (CIF, FOB, DAP)", type: "Doc", size: "220 KB" },
  { title: "Livorno warehouse SOP", type: "Doc", size: "480 KB" },
  { title: "Global importer directory · v14", type: "Sheet", size: "3.4 MB" },
  { title: "Container loading templates", type: "Sheet", size: "180 KB" },
  { title: "Stone care & install guide", type: "Doc", size: "760 KB" },
];

const activity = [
  { text: "Quote Coach revised Q-2418 with a bundle discount", time: "12m", tone: "success" as const },
  { text: "Lead Enricher scored 12 new leads (avg 74/100)", time: "34m", tone: "info" as const },
  { text: "Pricing Advisor flagged Calacatta Oro below floor", time: "1h", tone: "warning" as const },
  { text: "Logistics Planner drafted loading plan CNT-0092", time: "2h", tone: "info" as const },
  { text: "CEO Agent published morning digest", time: "6h", tone: "info" as const },
];

const chatSample = [
  {
    role: "user" as const,
    text: "Which warm US leads should I follow up with this week?",
  },
  {
    role: "assistant" as const,
    text:
      "Top 3 to prioritize: **Riverside Kitchens** (quote pending, high intent), **Concord Stoneworks** (viewed pricing 3× in 5 days), and **Sable Interiors — Miami** (last contact 9 days ago, in-market for quartz).",
    sources: ["CRM · Leads", "Website · pricing page", "Import records · US"],
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function AiCommandCenter() {
  const [section, setSection] = useState<SectionKey>("chat");
  const [input, setInput] = useState("");

  return (
    <AppShell>
      {/* Hero */}
      <section className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Arquane OS · AI
        </p>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
              Arquane AI Command Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your operating layer for research, drafting, and orchestrating agents across the business.
            </p>
          </div>
          <button
            onClick={openCommandPalette}
            className="hidden items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-border-strong md:inline-flex"
          >
            <CommandIcon className="h-3 w-3" /> K · Search everything
          </button>
        </div>
      </section>

      {/* Command Center layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="card-surface p-2 lg:sticky lg:top-[76px] lg:h-fit">
          <nav className="flex flex-row overflow-x-auto lg:flex-col">
            {sidebar.map((s) => {
              const active = section === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "flex shrink-0 items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {s.label}
                  </span>
                  {typeof s.count === "number" && (
                    <span className="chip text-[10px]">{s.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main pane */}
        <main className="min-w-0 space-y-4">
          {section === "chat" && <ChatPane input={input} setInput={setInput} />}
          {section === "commands" && <QuickCommandsPane />}
          {section === "tasks" && <RecentTasksPane />}
          {section === "agents" && <AgentsPane />}
          {section === "insights" && <InsightsPane />}
          {section === "prompts" && <SavedPromptsPane />}
          {section === "knowledge" && <KnowledgePane />}
          {section === "activity" && <ActivityPane />}
        </main>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Panes                                                               */
/* ------------------------------------------------------------------ */

function PaneHeader({
  title,
  desc,
  right,
}: {
  title: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

function ChatPane({
  input,
  setInput,
}: {
  input: string;
  setInput: (v: string) => void;
}) {
  const { active } = useBusinessContext();
  const suggestions = getAiSuggestions(active);
  const { primary } = suggestions;

  return (
    <>
      <div className="card-surface p-5">
        <PaneHeader
          title="Chat"
          desc="Ask about your pipeline, inventory, shipments, or draft anything."
          right={
            <div className="flex items-center gap-2">
              <button className="chip">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-success inline-block" />
                Grounded on your data
              </button>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground">
                New chat
              </button>
            </div>
          }
        />

        {/* Active context strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-surface-muted/40 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Focused on
          </span>
          <span className="text-[12.5px] font-medium text-foreground">
            {suggestions.focusLabel}
          </span>
          {primary?.sublabel && (
            <span className="text-[11.5px] text-muted-foreground">
              · {primary.sublabel}
            </span>
          )}
          {primary?.href && (
            <a
              href={primary.href}
              className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Transcript */}
        <div className="mt-5 space-y-4">
          {chatSample.map((m, i) => (
            <ChatMessage key={i} msg={m} />
          ))}
        </div>

        {/* Composer */}
        <div className="mt-5 rounded-xl border border-border bg-surface-muted/40 p-2.5">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder={
                primary
                  ? `Ask Arquane AI about ${primary.label}…`
                  : "Ask Arquane AI anything… (⌘⏎ to send)"
              }
              className="min-h-[52px] flex-1 resize-none bg-transparent px-2 py-1 text-[14px] outline-none placeholder:text-muted-foreground"
            />
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" aria-label="Attach">
              <Paperclip className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground" aria-label="Voice">
              <Mic className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
            <span className="text-[11px] text-muted-foreground">Try:</span>
            {suggestions.prompts.slice(0, 4).map((p) => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] text-foreground/80 hover:border-border-strong hover:bg-surface-muted"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contextual side widgets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Bot className="h-3.5 w-3.5 text-primary" /> Active agents
          </div>
          <ul className="mt-3 space-y-2">
            {agents.slice(0, 3).map((a) => (
              <li key={a.name} className="flex items-center justify-between text-[12.5px]">
                <span className="truncate">{a.name}</span>
                <span className="chip text-[10px]">{a.runs} runs</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Lightbulb className="h-3.5 w-3.5 text-primary" /> Top insight
          </div>
          <div className="mt-2 text-[12.5px] font-medium text-foreground">
            {suggestions.insight.title}
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            {suggestions.insight.body}
          </p>
        </div>
        <div className="card-surface p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <Library className="h-3.5 w-3.5 text-primary" /> Knowledge in context
          </div>
          <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
            {suggestions.knowledge.map((k) => (
              <li key={k}>· {k}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}


function ChatMessage({
  msg,
}: {
  msg: { role: "user" | "assistant"; text: string; sources?: string[] };
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[13.5px] text-primary-foreground">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] leading-relaxed text-foreground/95">{msg.text}</div>
        {msg.sources && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.sources.map((s) => (
              <span key={s} className="chip text-[10.5px]">
                <ScrollText className="mr-1 h-3 w-3" /> {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickCommandsPane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader
        title="Quick Commands"
        desc="One-click actions the AI runs against your live business data."
        right={
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> New command
          </button>
        }
      />
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {quickCommands.map((c) => (
          <button
            key={c.label}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted/40 px-3 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <c.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{c.label}</div>
                <div className="text-[11px] text-muted-foreground">{c.category}</div>
              </div>
            </div>
            <Play className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RecentTasksPane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader title="Recent Tasks" desc="What agents have been doing on your behalf." />
      <ul className="mt-5 divide-y divide-border">
        {recentTasks.map((t) => (
          <li key={t.title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <TaskStatus status={t.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{t.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {t.agent} · {t.when}
              </div>
            </div>
            <button className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground">
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TaskStatus({ status }: { status: "done" | "running" | "review" }) {
  if (status === "done") {
    return (
      <span className="mt-0.5 inline-flex h-5 items-center gap-1 rounded-full bg-success/10 px-1.5 text-[10px] font-medium text-success">
        <CheckCircle2 className="h-3 w-3" /> done
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="mt-0.5 inline-flex h-5 items-center gap-1 rounded-full bg-info/10 px-1.5 text-[10px] font-medium text-info">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-info" /> running
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex h-5 items-center gap-1 rounded-full bg-warning/10 px-1.5 text-[10px] font-medium text-warning">
      <AlertTriangle className="h-3 w-3" /> review
    </span>
  );
}

function AgentsPane() {
  const { active } = useBusinessContext();
  const activeKind = (Object.keys(active) as Array<keyof typeof active>)[0];
  const scoped = new Set(agentsForScope(activeKind ?? null).map((a) => a.id));

  return (
    <div className="card-surface p-5">
      <PaneHeader
        title="AI Agents"
        desc="Specialized agents wired to your business surfaces — scopes, tools, triggers and guardrails."
        right={
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> New agent
          </button>
        }
      />
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {AGENT_REGISTRY.map((a) => (
          <li
            key={a.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-surface-muted/40 p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-[13.5px] font-semibold">{a.name}</div>
                {a.status !== "active" && (
                  <span className="chip text-[10px]">{a.status}</span>
                )}
                {scoped.has(a.id) && (
                  <StatusPill tone="primary" className="text-[10px]">
                    in scope
                  </StatusPill>
                )}
              </div>
              <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{a.role}</p>

              <div className="mt-2 flex flex-wrap gap-1">
                {a.tools.map((t) => (
                  <span
                    key={t.id}
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10.5px]",
                      t.needsApproval
                        ? "border-warning/30 bg-warning/10 text-warning"
                        : "border-border bg-surface text-muted-foreground",
                    )}
                    title={t.needsApproval ? "Requires approval" : "Read-only tool"}
                  >
                    {t.label}
                  </span>
                ))}
              </div>

              <div className="mt-2 text-[11px] text-muted-foreground">
                {a.triggers.map((t) => TRIGGER_LABEL[t]).join(" · ")}
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {a.guardrails.map((g) => (
                  <li key={g} className="text-[11px] text-muted-foreground">
                    · {g}
                  </li>
                ))}
              </ul>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{a.runs30d} runs · 30d</span>
                <button className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  Configure <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightsPane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader title="Insights" desc="AI-generated opportunities and risks across the business." />
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {insights.map((i) => (
          <li
            key={i.title}
            className={cn(
              "rounded-lg border p-4 transition-colors",
              i.tone === "opportunity"
                ? "border-border bg-surface-muted/40"
                : "border-warning/30 bg-warning/[0.04]",
            )}
          >
            <div className="flex items-start gap-2">
              {i.tone === "opportunity" ? (
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{i.title}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{i.body}</p>
                <button className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
                  Take action <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SavedPromptsPane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader
        title="Saved Prompts"
        desc="Reusable prompts your team relies on."
        right={
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> Save prompt
          </button>
        }
      />
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search prompts…"
          className="h-9 w-full rounded-md border border-border bg-surface-muted pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:bg-surface"
        />
      </div>
      <ul className="mt-4 divide-y divide-border">
        {savedPrompts.map((p) => (
          <li key={p.title} className="group flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <Bookmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-[13px]">{p.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip text-[10px]">{p.tag}</span>
              <button className="opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KnowledgePane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader
        title="Knowledge"
        desc="Documents, sheets, and sources grounding your AI."
        right={
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> Upload
          </button>
        }
      />
      <ul className="mt-5 grid gap-2 md:grid-cols-2">
        {knowledge.map((k) => (
          <li
            key={k.title}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{k.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {k.type} · {k.size}
                </div>
              </div>
            </div>
            <button className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground">
              Open
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityPane() {
  return (
    <div className="card-surface p-5">
      <PaneHeader title="Activity" desc="Recent agent and AI events across Arquane OS." />
      <ul className="mt-5 divide-y divide-border">
        {activity.map((a) => (
          <li key={a.text} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <ToneDot tone={a.tone} />
            <div className="min-w-0 flex-1 text-[13px]">{a.text}</div>
            <span className="shrink-0 text-[11px] text-muted-foreground">{a.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToneDot({ tone }: { tone: "success" | "info" | "warning" }) {
  const color = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-info";
  return <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", color)} />;
}
