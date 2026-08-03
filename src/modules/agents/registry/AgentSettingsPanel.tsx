import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { AgentPermission, AgentRecord } from "../types";
import { PERMISSION_LABEL, toggleAgentPermission, updateAgentSettings } from "./registry";

const ALL_PERMISSIONS: AgentPermission[] = [
  "read",
  "write",
  "notify",
  "external_send",
  "financial",
];

const MODELS = ["gpt-5.5-reasoning", "gpt-5.5-mini", "claude-sonnet", "gemini-flash"];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium text-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-surface-muted border border-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/** Agent settings + permissions editor. */
export function AgentSettingsPanel({ agent }: { agent: AgentRecord }) {
  const s = agent.settings;
  const set = (patch: Parameters<typeof updateAgentSettings>[1]) =>
    updateAgentSettings(agent.id, patch);

  return (
    <div className="space-y-3">
      <SectionCard title="Agent settings" subtitle={`${agent.name} · ${agent.workflowId}`}>
        <div className="-mt-1">
          <Row label="Enabled" hint="Paused agents ignore all triggers">
            <Toggle checked={s.enabled} onChange={(v) => set({ enabled: v })} label="Enable agent" />
          </Row>
          <Row label="Auto-approve tools" hint="Skips the human approval gate for write tools">
            <Toggle
              checked={s.autoApprove}
              onChange={(v) => set({ autoApprove: v })}
              label="Auto-approve tools"
            />
          </Row>
          <Row label="Notify on failure" hint="Alerts the assigned user in the Notification Center">
            <Toggle
              checked={s.notifyOnFailure}
              onChange={(v) => set({ notifyOnFailure: v })}
              label="Notify on failure"
            />
          </Row>
          <Row label="Model" hint="Used once the LLM runtime is connected">
            <select
              value={s.model}
              onChange={(e) => set({ model: e.target.value })}
              aria-label="Model"
              className="rounded-md border border-border bg-surface px-2 py-1 text-[12px]"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Temperature" hint={`Currently ${s.temperature.toFixed(1)}`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={s.temperature}
              onChange={(e) => set({ temperature: Number(e.target.value) })}
              aria-label="Temperature"
              className="w-32 accent-[hsl(var(--primary))]"
            />
          </Row>
          <Row label="Max steps" hint="Hard stop for the tool loop">
            <input
              type="number"
              min={1}
              max={50}
              value={s.maxSteps}
              onChange={(e) => set({ maxSteps: Number(e.target.value) })}
              aria-label="Max steps"
              className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-[12px]"
            />
          </Row>
          <Row label="Daily run limit" hint="Agent pauses itself once reached">
            <input
              type="number"
              min={1}
              max={999}
              value={s.dailyRunLimit}
              onChange={(e) => set({ dailyRunLimit: Number(e.target.value) })}
              aria-label="Daily run limit"
              className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-[12px]"
            />
          </Row>
          <Row label="Assigned user" hint="Owns approvals and failure alerts">
            <input
              value={s.assignedUser}
              onChange={(e) => set({ assignedUser: e.target.value })}
              aria-label="Assigned user"
              className="w-44 rounded-md border border-border bg-surface px-2 py-1 text-[12px]"
            />
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Permissions" subtitle="What this agent is allowed to touch">
        <ul className="-mt-1 space-y-1.5">
          {ALL_PERMISSIONS.map((p) => {
            const on = agent.permissions.includes(p);
            return (
              <li key={p} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-foreground">
                  <ShieldCheck
                    className={cn("h-3.5 w-3.5", on ? "text-success" : "text-muted-foreground")}
                  />
                  {PERMISSION_LABEL[p]}
                </span>
                <Toggle
                  checked={on}
                  onChange={() => toggleAgentPermission(agent.id, p)}
                  label={PERMISSION_LABEL[p]}
                />
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Guardrails" subtitle="Enforced by the runtime, not the prompt">
        <ul className="-mt-1 space-y-1">
          {agent.guardrails.map((g) => (
            <li key={g} className="flex gap-2 text-[12px] text-foreground/90">
              <span className="text-primary">•</span>
              {g}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
