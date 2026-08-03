import { Bot, Play, Settings2, ShieldCheck, Zap } from "lucide-react";
import { StatusPill } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { AgentRecord } from "../types";
import { PERMISSION_LABEL } from "./registry";
import { TRIGGER_LABEL } from "../triggers/triggers";

const STATUS_TONE = { active: "success", beta: "warning", draft: "neutral" } as const;

/** Agent registry card — identity, workflow, permissions and quick actions. */
export function AgentRegistryCard({
  agent,
  selected,
  onSelect,
  onRun,
  onConfigure,
}: {
  agent: AgentRecord;
  selected?: boolean;
  onSelect?: () => void;
  onRun?: () => void;
  onConfigure?: () => void;
}) {
  return (
    <article
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-primary/40",
        selected && "border-primary/60 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[13.5px] font-semibold text-foreground">{agent.name}</h3>
            <StatusPill tone={STATUS_TONE[agent.status]} dot>
              {agent.status}
            </StatusPill>
            {!agent.settings.enabled && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">paused</span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{agent.role}</p>
          <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
            {agent.id} · {agent.workflowId}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        {agent.triggers.map((t) => (
          <span key={t} className="chip text-[10px]">
            <Zap className="mr-0.5 inline h-2.5 w-2.5" />
            {TRIGGER_LABEL[t]}
          </span>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {agent.permissions.map((p) => (
          <span
            key={p}
            title={PERMISSION_LABEL[p]}
            className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            <ShieldCheck className="h-2.5 w-2.5" /> {p.replace("_", " ")}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-[11px] text-muted-foreground">
          {agent.runs30d} runs · 30d · {agent.settings.assignedUser}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure?.();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" /> Settings
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRun?.();
            }}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
          >
            <Play className="h-3 w-3" /> Run
          </button>
        </div>
      </div>
    </article>
  );
}
