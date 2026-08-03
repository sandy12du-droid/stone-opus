import { RotateCcw, Square, ArrowUpRight } from "lucide-react";
import { StatusPill } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { AgentExecution } from "../types";
import { STATUS_LABEL, STATUS_TONE, formatClock, formatDuration, isActive } from "../runtime/status";
import { ProgressBar } from "./ProgressBar";

/** Execution history table — the audit surface for every agent run. */
export function ExecutionsTable({
  executions,
  onSelect,
  onRetry,
  onCancel,
  selectedId,
  className,
}: {
  executions: AgentExecution[];
  onSelect?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
}) {
  if (executions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/30 px-4 py-10 text-center">
        <p className="text-[13px] font-medium text-foreground">No executions yet</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          Run an agent from the registry and its full lifecycle appears here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full min-w-[900px] text-left text-[12.5px]">
        <thead className="bg-surface-muted/50 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Execution</th>
            <th className="px-3 py-2 font-medium">Agent / Workflow</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Current step</th>
            <th className="px-3 py-2 font-medium w-[140px]">Progress</th>
            <th className="px-3 py-2 font-medium">Assigned</th>
            <th className="px-3 py-2 font-medium">Started</th>
            <th className="px-3 py-2 font-medium">Finished</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {executions.map((e) => (
            <tr
              key={e.id}
              onClick={() => onSelect?.(e.id)}
              className={cn(
                "cursor-pointer bg-surface transition-colors hover:bg-surface-muted/40",
                selectedId === e.id && "bg-primary/5",
              )}
            >
              <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                {e.id.slice(-8)}
                {e.attempt > 1 && (
                  <span className="ml-1 text-warning">·a{e.attempt}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="font-medium text-foreground">{e.agentName}</div>
                <div className="font-mono text-[10.5px] text-muted-foreground">{e.workflowId}</div>
              </td>
              <td className="px-3 py-2">
                <StatusPill tone={STATUS_TONE[e.status]} dot>
                  {STATUS_LABEL[e.status]}
                </StatusPill>
                {e.simulation && <span className="ml-1 text-[10px] text-muted-foreground">sim</span>}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{e.currentStep ?? "—"}</td>
              <td className="px-3 py-2">
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
                    className="w-16"
                  />
                  <span className="tabular-nums text-[11px] text-muted-foreground">{e.progress}%</span>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{e.assignedUser}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatClock(e.startedAt)}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">
                {e.finishedAt ? `${formatClock(e.finishedAt)} · ${formatDuration(e)}` : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  {isActive(e.status) && onCancel && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onCancel(e.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      aria-label={`Cancel execution ${e.id.slice(-8)}`}
                    >
                      <Square className="h-3 w-3" />
                    </button>
                  )}
                  {onRetry && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onRetry(e.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      aria-label={`Retry execution ${e.id.slice(-8)}`}
                    >
                      <RotateCcw className="h-3 w-3" /> Retry
                    </button>
                  )}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
