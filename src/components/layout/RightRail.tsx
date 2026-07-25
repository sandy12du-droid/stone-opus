import { Sparkles, Bell, CheckSquare, Activity, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useBusinessContext } from "@/context/BusinessContext";
import { getAiSuggestions } from "@/lib/ai-context";


const tabs = [
  { id: "ai", label: "AI", icon: Sparkles },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function RightRail() {
  const [tab, setTab] = useState<TabId>("ai");

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[340px] shrink-0 flex-col border-l border-border bg-surface xl:flex">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[13px] font-semibold">Assistant</span>
        </div>
        <span className="chip">Beta</span>
      </div>

      <div className="flex gap-1 border-b border-border px-3 py-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "ai" && <AIPanel />}
        {tab === "notifications" && <EmptyState label="No new alerts" hint="Inventory and pipeline notifications will appear here." />}
        {tab === "tasks" && <EmptyState label="No open tasks" hint="Follow-ups assigned to you show up here." />}
        {tab === "activity" && <ActivityPanel />}
      </div>
    </aside>
  );
}


function AIPanel() {
  const { active } = useBusinessContext();
  const suggestions = getAiSuggestions(active);
  const { primary } = suggestions;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 rounded-md border border-dashed border-border bg-surface-muted/40 px-2.5 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Focused on
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="min-w-0 text-[12px] font-medium text-foreground truncate">
            {suggestions.focusLabel}
          </div>
          {primary?.href && (
            <Link
              to={primary.href}
              className="inline-flex shrink-0 items-center gap-0.5 text-[10.5px] font-medium text-primary hover:underline"
            >
              Open <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {primary?.sublabel && (
          <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
            {primary.sublabel}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Suggested prompts
        </div>
        <div className="mt-2 space-y-1.5">
          {suggestions.prompts.map((p) => (
            <button
              key={p}
              className="w-full rounded-md border border-border bg-surface px-2.5 py-2 text-left text-[12px] text-foreground/90 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-lg border border-dashed border-border p-3 text-[11px] leading-relaxed text-muted-foreground">
        Prompts adapt to the entity you're viewing. Assistant execution is not
        wired yet — this is the awareness layer.
      </div>
    </div>
  );
}


function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-2 h-10 w-10 rounded-full bg-surface-muted" />
      <div className="text-[13px] font-medium text-foreground">{label}</div>
      <div className="mt-1 max-w-[220px] text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}
