import { useState } from "react";
import { FlaskConical, Play } from "lucide-react";
import { AGENT_REGISTRY } from "@/lib/agents";
import { useBusinessContext } from "@/context/BusinessContext";
import { startAgentRun, useAgentRun } from "@/lib/agent-runtime";
import { RunLogView } from "./RunLogView";

/** Simulation-mode console: run an agent end-to-end without mutating anything. */
export function AgentTestConsole() {
  const { active } = useBusinessContext();
  const [agentId, setAgentId] = useState(AGENT_REGISTRY[0].id);
  const [prompt, setPrompt] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const run = useAgentRun(runId);

  const agent = AGENT_REGISTRY.find((a) => a.id === agentId)!;
  const entity = agent.scopes.map((k) => active[k]).find(Boolean);
  const running = run?.status === "running";

  const handleRun = () => {
    setRunId(
      startAgentRun({
        agent,
        prompt: prompt.trim() || agent.samplePrompts[0],
        entity,
        contextLabel: entity
          ? `${entity.label}${entity.sublabel ? ` · ${entity.sublabel}` : ""}`
          : undefined,
        simulation: true,
      }),
    );
  };

  return (
    <div className="card-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-foreground">
            <FlaskConical className="h-4 w-4 text-primary" /> Test Console
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dry-run any agent in simulation mode — tools are traced, nothing is written.
          </p>
        </div>
        <span className="chip text-[10px]">simulation</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[240px_1fr]">
        <div>
          <label
            htmlFor="test-agent"
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Agent
          </label>
          <select
            id="test-agent"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-2 text-[12.5px]"
          >
            {AGENT_REGISTRY.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Context: {entity ? entity.label : "none in scope"}
          </p>
        </div>

        <div>
          <label
            htmlFor="test-prompt"
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            Instruction
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="test-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={agent.samplePrompts[0]}
              className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-border-strong"
            />
            <button
              onClick={handleRun}
              disabled={running}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" /> {running ? "Running…" : "Simulate"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <RunLogView run={run} />
      </div>
    </div>
  );
}
