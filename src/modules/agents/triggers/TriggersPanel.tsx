import { useState } from "react";
import { Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRecord, TriggerConfig } from "../types";
import { TRIGGER_LABEL, getTriggerConfigs, setTriggerConfigs } from "./triggers";

/** View and configure how an agent is triggered. */
export function TriggersPanel({
  agent,
  onRun,
}: {
  agent: AgentRecord;
  onRun?: () => void;
}) {
  const [configs, setLocal] = useState<TriggerConfig[]>(() => getTriggerConfigs(agent.id));

  const update = (type: TriggerConfig["type"], patch: Partial<TriggerConfig>) => {
    const next = configs.map((c) => (c.type === type ? { ...c, ...patch } : c));
    setLocal(next);
    setTriggerConfigs(agent.id, next);
  };

  return (
    <div className="space-y-2">
      {configs.map((c) => (
        <div
          key={c.type}
          className={cn(
            "rounded-lg border px-3 py-2.5",
            c.enabled ? "border-border bg-surface" : "border-dashed border-border bg-surface-muted/30",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-foreground">
                {TRIGGER_LABEL[c.type]}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> last {c.lastRun ?? "—"} · next {c.nextRun ?? "—"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {c.type === "manual" && onRun && (
                <button
                  onClick={onRun}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <Play className="h-3 w-3" /> Run now
                </button>
              )}
              <button
                role="switch"
                aria-checked={c.enabled}
                aria-label={`Enable ${TRIGGER_LABEL[c.type]} trigger`}
                onClick={() => update(c.type, { enabled: !c.enabled })}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  c.enabled ? "bg-primary" : "border border-border bg-surface-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
                    c.enabled ? "translate-x-[18px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          </div>
          <input
            value={c.schedule}
            onChange={(e) => update(c.type, { schedule: e.target.value })}
            aria-label={`${TRIGGER_LABEL[c.type]} schedule`}
            className="mt-2 w-full rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] text-foreground"
          />
        </div>
      ))}
    </div>
  );
}
