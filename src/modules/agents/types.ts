/**
 * Arquane Agent Operating Layer — core domain types.
 *
 * This is the contract every future runtime (n8n workflows, OpenAI/GPT calls,
 * internal server functions) must satisfy. Nothing here talks to a model or a
 * network: the UI and the data model are designed first, execution is swapped
 * in behind `AgentService`.
 */
import type { BusinessEntity, BusinessEntityKind } from "@/context/BusinessContext";
import type { AgentDomain, AgentStatus, AgentTool, AgentTrigger } from "@/lib/agents";

export type { AgentDomain, AgentStatus, AgentTool, AgentTrigger };

/* ------------------------------ lifecycle ------------------------------ */

/**
 * Canonical agent execution lifecycle:
 * idle → queued → running → [waiting_approval → approved|edited|rejected] →
 * executing → completed | failed
 */
export type ExecutionStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "executing"
  | "completed"
  | "failed";

export const EXECUTION_LIFECYCLE: ExecutionStatus[] = [
  "queued",
  "running",
  "waiting_approval",
  "approved",
  "executing",
  "completed",
];

export type StepStatus =
  | "pending"
  | "running"
  | "waiting_approval"
  | "done"
  | "skipped"
  | "failed";

export interface ExecutionStep {
  id: string;
  label: string;
  toolId: string;
  needsApproval: boolean;
  status: StepStatus;
  startedAt?: number;
  finishedAt?: number;
  /** Latency in ms once finished. */
  ms?: number;
}

export type LogLevel = "info" | "tool" | "approval" | "result" | "warn" | "error";

export interface ExecutionLogEntry {
  id: string;
  at: number;
  level: LogLevel;
  label: string;
  detail?: string;
  stepId?: string;
  ms?: number;
}

/* ------------------------------ executions ----------------------------- */

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName: string;
  /** n8n workflow this execution maps to (placeholder until n8n is wired). */
  workflowId: string;
  status: ExecutionStatus;
  /** Label of the step currently in flight. */
  currentStep?: string;
  /** 0–100. */
  progress: number;
  startedAt: number;
  queuedAt: number;
  finishedAt?: number;
  approvalRequired: boolean;
  assignedUser: string;
  triggeredBy: AgentTrigger;
  prompt: string;
  contextLabel?: string;
  entity?: BusinessEntity;
  /** Simulation runs never mutate business data. */
  simulation: boolean;
  attempt: number;
  /** Set when this execution was created by retrying another one. */
  retryOf?: string;
  steps: ExecutionStep[];
  logs: ExecutionLogEntry[];
  output?: string[];
  error?: string;
  tokens?: { input: number; output: number };
}

/* ------------------------------ approvals ------------------------------ */

export type ApprovalDecision = "approved" | "edited" | "rejected";

export interface ApprovalRequest {
  id: string;
  executionId: string;
  agentId: string;
  agentName: string;
  stepId: string;
  toolId: string;
  toolLabel: string;
  summary: string;
  /** What the agent intends to write, shown/editable in the approval queue. */
  payload: Record<string, string>;
  contextLabel?: string;
  entity?: BusinessEntity;
  assignedUser: string;
  requestedAt: number;
  status: "pending" | ApprovalDecision;
  decidedAt?: number;
  decidedBy?: string;
  note?: string;
  editedPayload?: Record<string, string>;
}

/* ------------------------------- registry ------------------------------ */

export type AgentPermission =
  | "read"
  | "write"
  | "notify"
  | "external_send"
  | "financial";

export interface AgentSettings {
  enabled: boolean;
  /** Auto-approve tools flagged as approval-required. */
  autoApprove: boolean;
  model: string;
  temperature: number;
  maxSteps: number;
  /** Executions allowed per day before the agent pauses itself. */
  dailyRunLimit: number;
  assignedUser: string;
  notifyOnFailure: boolean;
}

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  domain: AgentDomain;
  status: AgentStatus;
  workflowId: string;
  scopes: BusinessEntityKind[];
  tools: AgentTool[];
  triggers: AgentTrigger[];
  guardrails: string[];
  samplePrompts: string[];
  permissions: AgentPermission[];
  settings: AgentSettings;
  runs30d: number;
}

export interface TriggerConfig {
  agentId: string;
  type: AgentTrigger;
  enabled: boolean;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  domain: AgentDomain;
  workflowId: string;
  tools: AgentTool[];
  triggers: AgentTrigger[];
  permissions: AgentPermission[];
}

/* -------------------------------- service ------------------------------ */

export interface StartExecutionInput {
  agentId: string;
  prompt: string;
  entity?: BusinessEntity;
  contextLabel?: string;
  simulation?: boolean;
  autoApprove?: boolean;
  triggeredBy?: AgentTrigger;
  assignedUser?: string;
}

/**
 * The single seam between the UI and real execution. `SimulationAgentService`
 * implements it today; an `N8nAgentService` / `LlmAgentService` can implement
 * it later without touching a single component.
 */
export interface AgentService {
  readonly kind: "simulation" | "n8n" | "llm";
  start(input: StartExecutionInput): string;
  cancel(executionId: string): void;
  retry(executionId: string): string | undefined;
  resolveApproval(
    approvalId: string,
    decision: ApprovalDecision,
    options?: { note?: string; editedPayload?: Record<string, string>; by?: string },
  ): void;
}
