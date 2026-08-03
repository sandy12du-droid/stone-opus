/**
 * Agent Registry — declarative source of truth for every agent, enriched with
 * workflow id, permissions and runtime settings. Built on top of the existing
 * `AGENT_REGISTRY` definitions so nothing duplicates.
 */
import { AGENT_REGISTRY } from "@/lib/agents";
import { useSyncExternalStore } from "react";
import type { AgentPermission, AgentRecord, AgentSettings } from "../types";

const WORKFLOW_ID: Record<string, string> = {
  "lead-enricher": "n8n-wf-crm-lead-enrich-01",
  "quote-coach": "n8n-wf-sales-quote-coach-04",
  "logistics-planner": "n8n-wf-logistics-consolidate-02",
  "pricing-advisor": "n8n-wf-pricing-guard-07",
  "production-monitor": "n8n-wf-production-watch-03",
  "ceo-agent": "n8n-wf-exec-digest-09",
};

const PERMISSIONS: Record<string, AgentPermission[]> = {
  "lead-enricher": ["read", "write", "notify"],
  "quote-coach": ["read", "write", "financial"],
  "logistics-planner": ["read", "write", "external_send"],
  "pricing-advisor": ["read", "financial", "notify"],
  "production-monitor": ["read", "notify"],
  "ceo-agent": ["read", "notify"],
};

const OWNER: Record<string, string> = {
  "lead-enricher": "Nadia Rahman",
  "quote-coach": "Daniel Okoye",
  "logistics-planner": "Priya Menon",
  "pricing-advisor": "Marcus Vella",
  "production-monitor": "Chen Wei",
  "ceo-agent": "Executive Office",
};

export const PERMISSION_LABEL: Record<AgentPermission, string> = {
  read: "Read business data",
  write: "Write / update records",
  notify: "Send internal notifications",
  external_send: "Contact external parties",
  financial: "Touch pricing & margins",
};

function defaultSettings(id: string, hasApprovalTool: boolean): AgentSettings {
  return {
    enabled: true,
    autoApprove: false,
    model: "gpt-5.5-reasoning",
    temperature: 0.2,
    maxSteps: 12,
    dailyRunLimit: hasApprovalTool ? 40 : 120,
    assignedUser: OWNER[id] ?? "Unassigned",
    notifyOnFailure: true,
  };
}

let records: AgentRecord[] = AGENT_REGISTRY.map((a) => ({
  id: a.id,
  name: a.name,
  role: a.role,
  domain: a.domain,
  status: a.status,
  workflowId: WORKFLOW_ID[a.id] ?? `n8n-wf-${a.id}`,
  scopes: a.scopes,
  tools: a.tools,
  triggers: a.triggers,
  guardrails: a.guardrails,
  samplePrompts: a.samplePrompts,
  permissions: PERMISSIONS[a.id] ?? ["read"],
  settings: defaultSettings(a.id, a.tools.some((t) => t.needsApproval)),
  runs30d: a.runs30d,
}));

const listeners = new Set<() => void>();
const emit = () => {
  records = [...records];
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => records;

export function listAgents() {
  return records;
}

export function getAgentRecord(id: string) {
  return records.find((a) => a.id === id);
}

export function useAgentRegistry() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useAgentRecord(id?: string) {
  const all = useAgentRegistry();
  return id ? all.find((a) => a.id === id) : undefined;
}

export function updateAgentSettings(id: string, patch: Partial<AgentSettings>) {
  const i = records.findIndex((a) => a.id === id);
  if (i === -1) return;
  records[i] = { ...records[i], settings: { ...records[i].settings, ...patch } };
  emit();
}

export function toggleAgentPermission(id: string, permission: AgentPermission) {
  const i = records.findIndex((a) => a.id === id);
  if (i === -1) return;
  const current = records[i].permissions;
  records[i] = {
    ...records[i],
    permissions: current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current, permission],
  };
  emit();
}
