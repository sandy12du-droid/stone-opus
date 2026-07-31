/**
 * Agent runtime (simulation layer).
 *
 * No model calls yet — this module simulates agent runs deterministically so
 * the Command Center UI (run modal, test console, approvals feed, triggers
 * editor) behaves like the real thing. Swapping in real execution later means
 * replacing `simulateRun` and the approval resolver only.
 */
import { AGENT_REGISTRY, type AgentDefinition, type AgentTrigger } from "@/lib/agents";
import type { BusinessEntity } from "@/context/BusinessContext";
import { useSyncExternalStore } from "react";

export type RunStatus = "idle" | "running" | "waiting_approval" | "completed" | "failed";
export type LogLevel = "info" | "tool" | "approval" | "result" | "warn";

export interface RunLogEntry {
  id: string;
  at: number;
  level: LogLevel;
  label: string;
  detail?: string;
  /** Latency in ms for tool steps. */
  ms?: number;
}

export interface PendingApproval {
  id: string;
  runId: string;
  agentId: string;
  agentName: string;
  toolId: string;
  toolLabel: string;
  summary: string;
  contextLabel?: string;
  entity?: BusinessEntity;
  requestedAt: number;
  status: "pending" | "approved" | "denied";
}

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  contextLabel?: string;
  entity?: BusinessEntity;
  simulation: boolean;
  status: RunStatus;
  startedAt: number;
  finishedAt?: number;
  logs: RunLogEntry[];
  output?: string[];
  tokens?: { input: number; output: number };
}

/* --------------------------- store ---------------------------------- */

interface State {
  runs: AgentRun[];
  approvals: PendingApproval[];
}

let state: State = { runs: [], approvals: [] };
const listeners = new Set<() => void>();

function emit() {
  state = { runs: [...state.runs], approvals: [...state.approvals] };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => state;

export function useAgentRuntime() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useAgentRun(runId?: string | null) {
  const s = useAgentRuntime();
  return runId ? s.runs.find((r) => r.id === runId) : undefined;
}

export function usePendingApprovals() {
  const s = useAgentRuntime();
  return s.approvals.filter((a) => a.status === "pending");
}

/* --------------------------- simulation ------------------------------ */

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;

function push(runId: string, entry: Omit<RunLogEntry, "id" | "at">) {
  const run = state.runs.find((r) => r.id === runId);
  if (!run) return;
  run.logs = [...run.logs, { id: uid("log"), at: Date.now(), ...entry }];
  emit();
}

function patch(runId: string, next: Partial<AgentRun>) {
  const i = state.runs.findIndex((r) => r.id === runId);
  if (i === -1) return;
  state.runs[i] = { ...state.runs[i], ...next };
  emit();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function placeholderOutput(agent: AgentDefinition, contextLabel?: string): string[] {
  const target = contextLabel ?? "the current workspace";
  switch (agent.domain) {
    case "crm":
      return [
        `Verified 3 contact emails on ${target} · 1 bounced (procurement@).`,
        "Matched 2 historical import records — buying power scored 78/100 (High).",
        "Recommended next action: assign to Gulf desk, follow up within 48h.",
      ];
    case "sales":
      return [
        `Bundle opportunity on ${target}: add 12 slabs Calacatta Oro 20mm (+$18,400).`,
        "Suggested incoterms: CIF Houston — matches this account's last 4 orders.",
        "Follow-up cadence: day 2 recap email, day 6 call, day 10 revised offer.",
      ];
    case "logistics":
      return [
        `Consolidation plan for ${target}: 2 × 40HQ, 91.4% volume utilisation.`,
        "Weight check: 26.8t of 28.0t limit — within tolerance.",
        "Earliest sailing: Mon 03:00, Port Klang → Houston (18 days transit).",
      ];
    case "pricing":
      return [
        `${target}: list price 4.2% below regional market average.`,
        "Margin at floor +1.8% after FX drift (USD/MYR −0.9% this week).",
        "Proposed update: +$3.10/sq ft on 20mm, hold 30mm unchanged.",
      ];
    case "production":
      return [
        `${target}: 2 work orders slipping (Polishing, Crating).`,
        "Capacity risk on Line B Thursday — 118% loaded.",
        "Resequencing suggestion prepared, awaiting approval.",
      ];
    default:
      return [
        `Executive briefing generated for ${target}.`,
        "3 positive signals, 2 risks, 1 decision required.",
        "Digest ready to publish to the workspace feed.",
      ];
  }
}

export interface StartRunOptions {
  agent: AgentDefinition;
  prompt: string;
  entity?: BusinessEntity;
  contextLabel?: string;
  simulation?: boolean;
  /** When true, approval-required tools are auto-approved in the log. */
  autoApprove?: boolean;
}

export function startAgentRun(opts: StartRunOptions): string {
  const { agent, prompt, entity, contextLabel, simulation = false, autoApprove = false } = opts;
  const runId = uid("run");
  const run: AgentRun = {
    id: runId,
    agentId: agent.id,
    agentName: agent.name,
    prompt,
    contextLabel,
    entity,
    simulation,
    status: "running",
    startedAt: Date.now(),
    logs: [],
    tokens: { input: 0, output: 0 },
  };
  state.runs = [run, ...state.runs].slice(0, 40);
  emit();

  void (async () => {
    push(runId, {
      level: "info",
      label: simulation ? "Simulation started" : "Run started",
      detail: contextLabel ? `Context: ${contextLabel}` : "No business context attached",
    });
    await wait(320);
    push(runId, {
      level: "info",
      label: "Plan drafted",
      detail: `${agent.tools.length} tools in scope · guardrails: ${agent.guardrails.length}`,
    });

    let requestedApproval = false;
    for (const tool of agent.tools) {
      await wait(380);
      if (tool.needsApproval) {
        if (simulation || autoApprove) {
          push(runId, {
            level: "approval",
            label: `${tool.label} — approval bypassed`,
            detail: simulation ? "Simulation mode: no data was mutated" : "Auto-approved by operator",
          });
        } else {
          requestedApproval = true;
          const approval: PendingApproval = {
            id: uid("apr"),
            runId,
            agentId: agent.id,
            agentName: agent.name,
            toolId: tool.id,
            toolLabel: tool.label,
            summary: `${agent.name} wants to run "${tool.label}"${contextLabel ? ` on ${contextLabel}` : ""}.`,
            contextLabel,
            entity,
            requestedAt: Date.now(),
            status: "pending",
          };
          state.approvals = [approval, ...state.approvals];
          push(runId, {
            level: "approval",
            label: `${tool.label} — awaiting approval`,
            detail: "Sent to the Approvals feed",
          });
        }
        continue;
      }
      push(runId, {
        level: "tool",
        label: tool.label,
        detail: tool.id,
        ms: 180 + Math.round(((seq * 37) % 9) * 40),
      });
    }

    await wait(420);
    const output = placeholderOutput(agent, contextLabel);
    output.forEach((line) => push(runId, { level: "result", label: line }));
    patch(runId, {
      status: requestedApproval ? "waiting_approval" : "completed",
      finishedAt: Date.now(),
      output,
      tokens: { input: 1240 + agent.tools.length * 90, output: 380 + output.length * 60 },
    });
  })();

  return runId;
}

export function resolveApproval(id: string, decision: "approved" | "denied") {
  const a = state.approvals.find((x) => x.id === id);
  if (!a || a.status !== "pending") return;
  a.status = decision;
  push(a.runId, {
    level: decision === "approved" ? "tool" : "warn",
    label: `${a.toolLabel} — ${decision}`,
    detail: decision === "approved" ? "Executed after human approval" : "Skipped by operator",
  });
  const stillPending = state.approvals.some(
    (x) => x.runId === a.runId && x.status === "pending",
  );
  if (!stillPending) {
    patch(a.runId, { status: "completed", finishedAt: Date.now() });
  }
  emit();
}

/* --------------------------- triggers -------------------------------- */

export interface TriggerConfig {
  agentId: string;
  type: AgentTrigger;
  enabled: boolean;
  /** Human-readable schedule/condition, e.g. "Weekdays · 07:30 GST" */
  schedule: string;
  lastRun?: string;
  nextRun?: string;
}

const DEFAULT_SCHEDULES: Record<AgentTrigger, string> = {
  manual: "On demand from the Command Center",
  context: "When an in-scope record is opened",
  scheduled: "Weekdays · 07:30 GST",
  event: "On record status change",
};

const NEXT_RUN: Record<AgentTrigger, string> = {
  manual: "—",
  context: "On next record open",
  scheduled: "Tomorrow · 07:30 GST",
  event: "Live",
};

const LAST_RUN: Record<AgentTrigger, string> = {
  manual: "2h ago",
  context: "18m ago",
  scheduled: "Today · 07:30 GST",
  event: "41m ago",
};

export function defaultTriggerConfigs(agent: AgentDefinition): TriggerConfig[] {
  return agent.triggers.map((t) => ({
    agentId: agent.id,
    type: t,
    enabled: t !== "event" ? true : agent.status === "active",
    schedule: DEFAULT_SCHEDULES[t],
    lastRun: LAST_RUN[t],
    nextRun: NEXT_RUN[t],
  }));
}

const triggerStore = new Map<string, TriggerConfig[]>();

export function getTriggerConfigs(agentId: string): TriggerConfig[] {
  const existing = triggerStore.get(agentId);
  if (existing) return existing;
  const agent = AGENT_REGISTRY.find((a) => a.id === agentId);
  const next = agent ? defaultTriggerConfigs(agent) : [];
  triggerStore.set(agentId, next);
  return next;
}

export function setTriggerConfigs(agentId: string, configs: TriggerConfig[]) {
  triggerStore.set(agentId, configs);
}
