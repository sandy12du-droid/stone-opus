import { useMemo, useState } from "react";
import { Bot, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useBusinessContext, type BusinessEntity } from "@/context/BusinessContext";
import type { AgentDefinition } from "@/lib/agents";
import { startAgentRun, useAgentRun } from "@/lib/agent-runtime";
import { RunLogView } from "./RunLogView";

/** Run an agent against a chosen business context. Placeholder execution only. */
export function AgentRunModal({
  agent,
  open,
  onOpenChange,
}: {
  agent: AgentDefinition | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { active, recent } = useBusinessContext();
  const [contextId, setContextId] = useState<string>("none");
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const run = useAgentRun(runId);

  const options = useMemo(() => {
    if (!agent) return [] as BusinessEntity[];
    const pool = [
      ...Object.values(active),
      ...recent,
    ].filter((e): e is BusinessEntity => Boolean(e) && agent.scopes.includes(e.kind));
    const seen = new Set<string>();
    return pool.filter((e) => {
      const key = `${e.kind}:${e.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [active, recent, agent]);

  if (!agent) return null;

  const selected = options.find((o) => `${o.kind}:${o.id}` === contextId);
  const running = run?.status === "running";

  const handleRun = () => {
    const id = startAgentRun({
      agent,
      prompt: prompt.trim() || agent.samplePrompts[0],
      entity: selected,
      contextLabel: selected ? `${selected.label}${selected.sublabel ? ` · ${selected.sublabel}` : ""}` : undefined,
    });
    setRunId(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </span>
            Run {agent.name}
          </DialogTitle>
          <DialogDescription className="text-[12px]">{agent.role}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="agent-run-context"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Business context
            </label>
            <select
              id="agent-run-context"
              value={contextId}
              onChange={(e) => setContextId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-2 text-[12.5px] text-foreground"
            >
              <option value="none">No context — run across the workspace</option>
              {options.map((o) => (
                <option key={`${o.kind}:${o.id}`} value={`${o.kind}:${o.id}`}>
                  {o.kind} · {o.label}
                  {o.sublabel ? ` — ${o.sublabel}` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              Scopes: {agent.scopes.join(", ")}
            </p>
          </div>

          <div>
            <label
              htmlFor="agent-run-prompt"
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Instruction
            </label>
            <textarea
              id="agent-run-prompt"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={agent.samplePrompts[0]}
              className="mt-1 w-full resize-none rounded-md border border-border bg-surface px-2.5 py-2 text-[12.5px] text-foreground outline-none focus:border-border-strong"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {agent.samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground hover:border-border-strong hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Approval-required tools pause the run and appear in the Approvals feed.
            </p>
            <button
              onClick={handleRun}
              disabled={running}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity",
                running && "opacity-50",
              )}
            >
              <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Run agent"}
            </button>
          </div>

          <RunLogView run={run} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
