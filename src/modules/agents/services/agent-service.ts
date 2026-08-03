/**
 * Agent services — the swap point for real execution.
 *
 * `simulationAgentService` is active today. `n8nAgentService` and
 * `llmAgentService` are declared (and intentionally unimplemented) so the UI
 * can already reason about "which runtime is this agent on".
 */
import {
  cancelExecution,
  resolveApprovalRequest,
  retryExecution,
  startExecution,
} from "../runtime/engine";
import type { AgentService } from "../types";

export const simulationAgentService: AgentService = {
  kind: "simulation",
  start: (input) => startExecution(input),
  cancel: (id) => cancelExecution(id),
  retry: (id) => retryExecution(id),
  resolveApproval: (id, decision, options) => resolveApprovalRequest(id, decision, options),
};

/** Placeholder — will POST to the n8n webhook for `agent.workflowId`. */
export const n8nAgentService: Partial<AgentService> & { kind: "n8n"; ready: boolean } = {
  kind: "n8n",
  ready: false,
};

let active: AgentService = simulationAgentService;

export function getAgentService(): AgentService {
  return active;
}

export function setAgentService(service: AgentService) {
  active = service;
}
