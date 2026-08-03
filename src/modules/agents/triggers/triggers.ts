/** Trigger configuration store (per agent). */
import { listAgents } from "../registry/registry";
import type { AgentTrigger, TriggerConfig } from "../types";

export const TRIGGER_LABEL: Record<AgentTrigger, string> = {
  manual: "Manual",
  context: "Context-aware",
  scheduled: "Scheduled",
  event: "Event-driven",
};

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

const store = new Map<string, TriggerConfig[]>();

export function getTriggerConfigs(agentId: string): TriggerConfig[] {
  const existing = store.get(agentId);
  if (existing) return existing;
  const agent = listAgents().find((a) => a.id === agentId);
  const next: TriggerConfig[] = (agent?.triggers ?? []).map((t) => ({
    agentId,
    type: t,
    enabled: t !== "event" ? true : agent?.status === "active",
    schedule: DEFAULT_SCHEDULES[t],
    lastRun: LAST_RUN[t],
    nextRun: NEXT_RUN[t],
  }));
  store.set(agentId, next);
  return next;
}

export function setTriggerConfigs(agentId: string, configs: TriggerConfig[]) {
  store.set(agentId, configs);
}
