import { RotateCcw, Square } from "lucide-react";
import { StatusPill, ToneDot } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { AgentExecution } from "../types";
import {
  STATUS_LABEL,
  STATUS_TONE,
  STEP_TONE,
  formatClock,
  formatDuration,
  isActive,
} from "../runtime/status";
import { ProgressBar } from "./ProgressBar";
import { LogStream } from "../logs/LogStream";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[12.5px] text-foreground">{value}</div>
    </div>
  );
}

/** Full execution record: every field the runtime contract promises. */
export function ExecutionDetail({
  execution,
  onRetry,
  onCancel,
  className,
}: {
  execution?: AgentExecution;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  className?: string;
}) {
  if (!execution) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 text-center text-[12px] text-muted-foreground",
          className,
        )}
      >
        Select an execution to inspect its steps, logs and approvals.
      </div>
    );
  }

  const e = execution;
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={STATUS_TONE[e.status]} dot>
          {STATUS_LABEL[e.status]}
        </StatusPill>
        {e.simulation && <span className="chip text-[10px]">simulation</span>}
        <span className="font-mono text-[11px] text-muted-foreground">{e.id.slice(-10)}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {isActive(e.status) && onCancel && (
            <button
              onClick={() => onCancel(e.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Square className="h-3 w-3" /> Cancel
            </button>
          )}
          {onRetry && (
            <button
              onClick={() => onRetry(e.id)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-surface-muted"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ProgressBar
          value={e.progress}
          tone={
            e.status === "failed" || e.status === "rejected"
              ? "danger"
              : e.status === "completed"
                ? "success"
                : e.status === "waiting_approval"
                  ? "warning"
                  : "primary"
          }
        />
        <span className="tabular-nums text-[11px] text-muted-foreground">{e.progress}%</span>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-4">
        <Field label="Agent ID" value={<span className="font-mono text-[11px]">{e.agentId}</span>} />
        <Field label="Agent name" value={e.agentName} />
        <Field
          label="Workflow ID"
          value={<span className="font-mono text-[11px]">{e.workflowId}</span>}
        />
        <Field label="Current step" value={e.currentStep ?? "—"} />
        <Field label="Started at" value={formatClock(e.startedAt)} />
        <Field
          label="Finished at"
          value={e.finishedAt ? `${formatClock(e.finishedAt)} · ${formatDuration(e)}` : "—"}
        />
        <Field label="Approval required" value={e.approvalRequired ? "Yes" : "No"} />
        <Field label="Assigned user" value={e.assignedUser} />
        <Field label="Triggered by" value={e.triggeredBy} />
        <Field label="Attempt" value={`#${e.attempt}${e.retryOf ? ` (retry of ${e.retryOf.slice(-6)})` : ""}`} />
        <Field label="Context" value={e.contextLabel ?? "None"} />
        <Field
          label="Tokens"
          value={e.tokens ? `${e.tokens.input} in / ${e.tokens.output} out` : "—"}
        />
      </div>

      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Steps
        </div>
        <ol className="mt-2 space-y-1.5">
          {e.steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-4 shrink-0 text-right font-mono text-[10.5px] text-muted-foreground">
                {i + 1}
              </span>
              <ToneDot tone={STEP_TONE[s.status]} />
              <span className="min-w-0 flex-1 truncate text-foreground">{s.label}</span>
              {s.needsApproval && (
                <span className="text-[10px] uppercase tracking-wide text-warning">approval</span>
              )}
              <span className="w-20 text-right text-[11px] text-muted-foreground">
                {s.ms ? `${s.ms}ms` : s.status}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Execution logs
        </div>
        <LogStream logs={e.logs} live={e.status === "running" || e.status === "executing"} />
      </div>

      {e.output && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Output (placeholder)
          </div>
          <ul className="mt-1.5 space-y-1">
            {e.output.map((o) => (
              <li key={o} className="flex gap-2 text-[12px] leading-snug text-foreground/90">
                <span className="text-primary">•</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
