/**
 * Execution engine — drives the canonical lifecycle:
 * queued → running → (waiting_approval → approved/edited/rejected) →
 * executing → completed | failed
 *
 * Today it simulates step timings deterministically. When n8n / GPT is wired,
 * only the bodies of `runSteps` and `finalize` change — every status, log and
 * approval shape stays identical.
 */
import { getAgentRecord } from "../registry/registry";
import type {
  AgentExecution,
  ApprovalDecision,
  ApprovalRequest,
  ExecutionStep,
  StartExecutionInput,
} from "../types";
import {
  addApproval,
  addExecution,
  appendLog,
  findApproval,
  findExecution,
  getState,
  patchApproval,
  patchExecution,
  patchStep,
  uid,
} from "./store";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cancelled = new Set<string>();

function placeholderOutput(domain: string, target: string): string[] {
  switch (domain) {
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

function approvalPayload(toolId: string, target: string): Record<string, string> {
  return {
    tool: toolId,
    target,
    mode: "write",
    reversible: "yes — change is versioned",
  };
}

export function startExecution(input: StartExecutionInput): string {
  const agent = getAgentRecord(input.agentId);
  if (!agent) throw new Error(`Unknown agent: ${input.agentId}`);

  const simulation = input.simulation ?? false;
  const autoApprove = input.autoApprove ?? agent.settings.autoApprove;
  const now = Date.now();
  const id = uid("exec");

  const steps: ExecutionStep[] = agent.tools.map((t) => ({
    id: uid("step"),
    label: t.label,
    toolId: t.id,
    needsApproval: Boolean(t.needsApproval),
    status: "pending",
  }));

  const exec: AgentExecution = {
    id,
    agentId: agent.id,
    agentName: agent.name,
    workflowId: agent.workflowId,
    status: "queued",
    progress: 0,
    queuedAt: now,
    startedAt: now,
    approvalRequired: steps.some((s) => s.needsApproval) && !simulation && !autoApprove,
    assignedUser: input.assignedUser ?? agent.settings.assignedUser,
    triggeredBy: input.triggeredBy ?? "manual",
    prompt: input.prompt,
    contextLabel: input.contextLabel,
    entity: input.entity,
    simulation,
    attempt: 1,
    steps,
    logs: [],
    tokens: { input: 0, output: 0 },
  };

  addExecution(exec);
  void drive(id, autoApprove);
  return id;
}

async function drive(execId: string, autoApprove: boolean) {
  const exec = findExecution(execId);
  if (!exec) return;
  const agent = getAgentRecord(exec.agentId);
  const target = exec.contextLabel ?? "the current workspace";

  appendLog(execId, {
    level: "info",
    label: exec.simulation ? "Queued (simulation)" : "Queued",
    detail: `Workflow ${exec.workflowId} · assigned to ${exec.assignedUser}`,
  });
  await wait(260);
  if (cancelled.has(execId)) return;

  patchExecution(execId, { status: "running", startedAt: Date.now(), currentStep: "Planning" });
  appendLog(execId, {
    level: "info",
    label: "Plan drafted",
    detail: `${exec.steps.length} steps in scope · guardrails: ${agent?.guardrails.length ?? 0}`,
  });

  for (const step of findExecution(execId)?.steps ?? []) {
    if (cancelled.has(execId)) return;
    await wait(360);

    if (step.needsApproval && !exec.simulation && !autoApprove) {
      patchStep(execId, step.id, { status: "waiting_approval", startedAt: Date.now() });
      patchExecution(execId, { status: "waiting_approval", currentStep: step.label });
      const req: ApprovalRequest = {
        id: uid("apr"),
        executionId: execId,
        agentId: exec.agentId,
        agentName: exec.agentName,
        stepId: step.id,
        toolId: step.toolId,
        toolLabel: step.label,
        summary: `${exec.agentName} wants to run "${step.label}"${exec.contextLabel ? ` on ${exec.contextLabel}` : ""}.`,
        payload: approvalPayload(step.toolId, target),
        contextLabel: exec.contextLabel,
        entity: exec.entity,
        assignedUser: exec.assignedUser,
        requestedAt: Date.now(),
        status: "pending",
      };
      addApproval(req);
      appendLog(execId, {
        level: "approval",
        label: `${step.label} — awaiting approval`,
        detail: `Sent to the approval queue · ${exec.assignedUser}`,
        stepId: step.id,
      });
      return; // execution parks here until the approval is resolved
    }

    runStep(execId, step.id, step.label, step.toolId, {
      bypassed: step.needsApproval,
      simulation: exec.simulation,
    });
  }

  finalize(execId, target);
}

function runStep(
  execId: string,
  stepId: string,
  label: string,
  toolId: string,
  opts: { bypassed?: boolean; simulation?: boolean } = {},
) {
  const ms = 160 + ((label.length * 37) % 9) * 40;
  patchStep(execId, stepId, {
    status: "done",
    startedAt: Date.now() - ms,
    finishedAt: Date.now(),
    ms,
  });
  appendLog(execId, {
    level: opts.bypassed ? "approval" : "tool",
    label: opts.bypassed ? `${label} — approval bypassed` : label,
    detail: opts.bypassed
      ? opts.simulation
        ? "Simulation mode: no data was mutated"
        : "Auto-approved by agent settings"
      : toolId,
    stepId,
    ms,
  });
}

/** Resume a parked execution after its pending approval was resolved. */
async function resume(execId: string) {
  const exec = findExecution(execId);
  if (!exec) return;
  const target = exec.contextLabel ?? "the current workspace";
  patchExecution(execId, { status: "executing" });

  for (const step of exec.steps) {
    if (cancelled.has(execId)) return;
    if (step.status !== "pending") continue;
    await wait(320);

    if (step.needsApproval) {
      // another approval gate — park again
      void drive(execId, false);
      return;
    }
    runStep(execId, step.id, step.label, step.toolId);
  }

  finalize(execId, target);
}

function finalize(execId: string, target: string) {
  const exec = findExecution(execId);
  if (!exec) return;
  const agent = getAgentRecord(exec.agentId);
  const rejected = getState().approvals.some(
    (a) => a.executionId === execId && a.status === "rejected",
  );
  const output = placeholderOutput(agent?.domain ?? "executive", target);
  output.forEach((line) => appendLog(execId, { level: "result", label: line }));
  patchExecution(execId, {
    status: rejected ? "rejected" : "completed",
    currentStep: undefined,
    progress: 100,
    finishedAt: Date.now(),
    output,
    tokens: {
      input: 1240 + exec.steps.length * 90,
      output: 380 + output.length * 60,
    },
  });
  appendLog(execId, {
    level: rejected ? "warn" : "result",
    label: rejected ? "Completed with rejected steps" : "Execution completed",
    detail: `${exec.steps.length} steps · ${((Date.now() - exec.startedAt) / 1000).toFixed(1)}s`,
  });
}

export function cancelExecution(execId: string) {
  const exec = findExecution(execId);
  if (!exec || exec.status === "completed" || exec.status === "failed") return;
  cancelled.add(execId);
  appendLog(execId, { level: "warn", label: "Cancelled by operator" });
  patchExecution(execId, { status: "failed", error: "Cancelled by operator", finishedAt: Date.now() });
}

export function retryExecution(execId: string): string | undefined {
  const prev = findExecution(execId);
  if (!prev) return;
  const id = startExecution({
    agentId: prev.agentId,
    prompt: prev.prompt,
    entity: prev.entity,
    contextLabel: prev.contextLabel,
    simulation: prev.simulation,
    triggeredBy: prev.triggeredBy,
    assignedUser: prev.assignedUser,
  });
  patchExecution(id, { attempt: prev.attempt + 1, retryOf: prev.id });
  appendLog(id, {
    level: "info",
    label: `Retry of ${prev.id.slice(-6)}`,
    detail: `Attempt ${prev.attempt + 1}`,
  });
  return id;
}

export function resolveApprovalRequest(
  approvalId: string,
  decision: ApprovalDecision,
  options: { note?: string; editedPayload?: Record<string, string>; by?: string } = {},
) {
  const req = findApproval(approvalId);
  if (!req || req.status !== "pending") return;

  patchApproval(approvalId, {
    status: decision,
    decidedAt: Date.now(),
    decidedBy: options.by ?? "You",
    note: options.note,
    editedPayload: options.editedPayload,
  });

  const execId = req.executionId;
  if (decision === "rejected") {
    patchStep(execId, req.stepId, { status: "skipped", finishedAt: Date.now() });
    appendLog(execId, {
      level: "warn",
      label: `${req.toolLabel} — rejected`,
      detail: options.note ?? "Skipped by operator",
      stepId: req.stepId,
    });
  } else {
    patchExecution(execId, { status: "approved" });
    patchStep(execId, req.stepId, { status: "done", finishedAt: Date.now(), ms: 240 });
    appendLog(execId, {
      level: "tool",
      label: `${req.toolLabel} — ${decision}`,
      detail:
        decision === "edited"
          ? `Executed with operator edits${options.note ? ` · ${options.note}` : ""}`
          : "Executed after human approval",
      stepId: req.stepId,
      ms: 240,
    });
  }

  void resume(execId);
}
