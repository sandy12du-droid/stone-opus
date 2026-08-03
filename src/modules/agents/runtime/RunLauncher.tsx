import { useState } from "react";
import { Play, FlaskConical, X } from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";
import type { AgentRecord } from "../types";
import { getAgentService } from "../services/agent-service";

/**
 * Launches an execution for an agent: prompt, business context and
 * simulation toggle. Returns the new execution id to the caller.
 */
export function RunLauncher({
  agent,
  onLaunched,
  onClose,
}: {
  agent: AgentRecord;
  onLaunched?: (executionId: string) => void;
  onClose?: () => void;
}) {
  const { entity, history } = useBusinessContext();
  const options = [entity, ...history.filter((h) => h.id !== entity?.id)].filter(Boolean).slice(0, 6);
  const [contextId, setContextId] = useState(entity?.id ?? "");
  const [prompt, setPrompt] = useState(agent.samplePrompts[0] ?? "");
  const [simulation, setSimulation] = useState(false);

  const selected = options.find((o) => o!.id === contextId) ?? undefined;

  const launch = () => {
    const id = getAgentService().start({
      agentId: agent.id,
      prompt,
      entity: selected ?? undefined,
      contextLabel: selected?.label,
      simulation,
      triggeredBy: "manual",
    });
    onLaunched?.(id);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Run {agent.name}</h3>
          <p className="font-mono text-[10.5px] text-muted-foreground">{agent.workflowId}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close launcher"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Business context
      </label>
      <select
        value={contextId}
        onChange={(e) => setContextId(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[12px]"
      >
        <option value="">No context — workspace-wide</option>
        {options.map((o) => (
          <option key={o!.id} value={o!.id}>
            {o!.kind} · {o!.label}
          </option>
        ))}
      </select>

      <label className="mt-2.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Instruction
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-[12px]"
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {agent.samplePrompts.map((p) => (
          <button
            key={p}
            onClick={() => setPrompt(p)}
            className="chip text-[10.5px] hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => {
            setSimulation(true);
            const id = getAgentService().start({
              agentId: agent.id,
              prompt,
              entity: selected ?? undefined,
              contextLabel: selected?.label,
              simulation: true,
              triggeredBy: "manual",
            });
            onLaunched?.(id);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
        >
          <FlaskConical className="h-3.5 w-3.5" /> Simulate
        </button>
        <button
          onClick={launch}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11.5px] font-medium text-primary-foreground"
        >
          <Play className="h-3.5 w-3.5" /> Run agent
        </button>
      </div>
      {simulation && (
        <p className="mt-1.5 text-[10.5px] text-muted-foreground">
          Simulation runs never mutate business data.
        </p>
      )}
    </div>
  );
}
