/**
 * Execution store — evented, in-memory, framework-agnostic.
 * Components subscribe with `useSyncExternalStore`; the engine mutates through
 * the exported helpers only.
 */
import { useSyncExternalStore } from "react";
import type {
  AgentExecution,
  ApprovalRequest,
  ExecutionLogEntry,
} from "../types";

interface RuntimeState {
  executions: AgentExecution[];
  approvals: ApprovalRequest[];
}

let state: RuntimeState = { executions: [], approvals: [] };
const listeners = new Set<() => void>();

export function emit() {
  state = { executions: [...state.executions], approvals: [...state.approvals] };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const snapshot = () => state;

export function getState() {
  return state;
}

export function useRuntimeState() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function useExecutions() {
  return useRuntimeState().executions;
}

export function useExecution(id?: string | null) {
  const s = useRuntimeState();
  return id ? s.executions.find((e) => e.id === id) : undefined;
}

export function useAgentExecutions(agentId?: string) {
  const s = useRuntimeState();
  return agentId ? s.executions.filter((e) => e.agentId === agentId) : s.executions;
}

export function useApprovals() {
  return useRuntimeState().approvals;
}

export function usePendingApprovalRequests() {
  return useRuntimeState().approvals.filter((a) => a.status === "pending");
}

/* ----------------------------- mutations ------------------------------- */

let seq = 0;
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${(seq += 1).toString(36)}`;

export function addExecution(exec: AgentExecution) {
  state.executions = [exec, ...state.executions].slice(0, 80);
  emit();
}

export function patchExecution(id: string, patch: Partial<AgentExecution>) {
  const i = state.executions.findIndex((e) => e.id === id);
  if (i === -1) return;
  state.executions[i] = { ...state.executions[i], ...patch };
  emit();
}

export function appendLog(id: string, entry: Omit<ExecutionLogEntry, "id" | "at">) {
  const exec = state.executions.find((e) => e.id === id);
  if (!exec) return;
  exec.logs = [...exec.logs, { id: uid("log"), at: Date.now(), ...entry }];
  emit();
}

export function patchStep(
  execId: string,
  stepId: string,
  patch: Partial<AgentExecution["steps"][number]>,
) {
  const exec = state.executions.find((e) => e.id === execId);
  if (!exec) return;
  exec.steps = exec.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s));
  const done = exec.steps.filter((s) => ["done", "skipped", "failed"].includes(s.status)).length;
  exec.progress = Math.round((done / Math.max(exec.steps.length, 1)) * 100);
  emit();
}

export function addApproval(req: ApprovalRequest) {
  state.approvals = [req, ...state.approvals];
  emit();
}

export function patchApproval(id: string, patch: Partial<ApprovalRequest>) {
  const i = state.approvals.findIndex((a) => a.id === id);
  if (i === -1) return;
  state.approvals[i] = { ...state.approvals[i], ...patch };
  emit();
}

export function findApproval(id: string) {
  return state.approvals.find((a) => a.id === id);
}

export function findExecution(id: string) {
  return state.executions.find((e) => e.id === id);
}
