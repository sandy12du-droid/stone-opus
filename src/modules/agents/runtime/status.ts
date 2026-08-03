import type { ExecutionStatus, StepStatus } from "../types";
import type { Tone } from "@/components/shared";

export const STATUS_LABEL: Record<ExecutionStatus, string> = {
  idle: "Idle",
  queued: "Queued",
  running: "Running",
  waiting_approval: "Waiting for approval",
  approved: "Approved",
  rejected: "Rejected",
  executing: "Executing",
  completed: "Completed",
  failed: "Failed",
};

export const STATUS_TONE: Record<ExecutionStatus, Tone> = {
  idle: "neutral",
  queued: "neutral",
  running: "primary",
  waiting_approval: "warning",
  approved: "info",
  rejected: "danger",
  executing: "primary",
  completed: "success",
  failed: "danger",
};

export const STEP_TONE: Record<StepStatus, Tone> = {
  pending: "neutral",
  running: "primary",
  waiting_approval: "warning",
  done: "success",
  skipped: "neutral",
  failed: "danger",
};

export function isActive(status: ExecutionStatus) {
  return ["queued", "running", "executing", "waiting_approval", "approved"].includes(status);
}

export function formatDuration(exec: { startedAt: number; finishedAt?: number }) {
  const end = exec.finishedAt ?? Date.now();
  return `${((end - exec.startedAt) / 1000).toFixed(1)}s`;
}

export function formatClock(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
