import { useState } from "react";
import { CalendarClock, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { AgentDefinition } from "@/lib/agents";
import { TRIGGER_LABEL } from "@/lib/agents";
import {
  getTriggerConfigs,
  setTriggerConfigs,
  type TriggerConfig,
} from "@/lib/agent-runtime";
import { toast } from "sonner";

const PRESETS: Record<string, string[]> = {
  scheduled: [
    "Weekdays · 07:30 GST",
    "Every hour · business hours",
    "Daily · 18:00 GST",
    "Mondays · 06:00 GST",
  ],
  event: [
    "On record status change",
    "On new lead created",
    "On quotation sent",
    "On container departure",
  ],
  context: ["When an in-scope record is opened", "When the right rail is expanded"],
  manual: ["On demand from the Command Center"],
};

/** View & configure how an agent is triggered. Placeholder schedules only. */
export function AgentTriggersPanel({
  agent,
  open,
  onOpenChange,
}: {
  agent: AgentDefinition | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [configs, setConfigs] = useState<TriggerConfig[]>(() =>
    agent ? getTriggerConfigs(agent.id) : [],
  );
  const [loadedFor, setLoadedFor] = useState<string | null>(agent?.id ?? null);

  if (!agent) return null;
  if (loadedFor !== agent.id) {
    setLoadedFor(agent.id);
    setConfigs(getTriggerConfigs(agent.id));
  }

  const update = (type: string, patch: Partial<TriggerConfig>) =>
    setConfigs((prev) => prev.map((c) => (c.type === type ? { ...c, ...patch } : c)));

  const save = () => {
    setTriggerConfigs(agent.id, configs);
    toast.success(`Triggers saved for ${agent.name}`, {
      description: "Schedules are placeholders until execution is wired.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CalendarClock className="h-3.5 w-3.5" />
            </span>
            {agent.name} · Triggers
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Choose when this agent wakes up and what schedule it follows.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {configs.map((c) => (
            <li key={c.type} className="rounded-lg border border-border bg-surface-muted/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">
                    {TRIGGER_LABEL[c.type]}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last run {c.lastRun ?? "—"} · Next {c.nextRun ?? "—"}
                  </div>
                </div>
                <Switch
                  checked={c.enabled}
                  onCheckedChange={(v) => update(c.type, { enabled: v })}
                  aria-label={`Enable ${TRIGGER_LABEL[c.type]} trigger`}
                />
              </div>

              {c.enabled && (
                <div className="mt-2.5">
                  <label
                    htmlFor={`schedule-${c.type}`}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    Schedule / condition
                  </label>
                  <input
                    id={`schedule-${c.type}`}
                    value={c.schedule}
                    onChange={(e) => update(c.type, { schedule: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-foreground outline-none focus:border-border-strong"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(PRESETS[c.type] ?? []).map((p) => (
                      <button
                        key={p}
                        onClick={() => update(c.type, { schedule: p })}
                        className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground hover:border-border-strong hover:text-foreground"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground"
          >
            <Save className="h-3.5 w-3.5" /> Save triggers
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
