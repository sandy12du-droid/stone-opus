import { CheckCircle2, CircleDashed, ShieldQuestion, Wrench, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRun, LogLevel } from "@/lib/agent-runtime";

const LEVEL_ICON: Record<LogLevel, React.ComponentType<{ className?: string }>> = {
  info: Info,
  tool: Wrench,
  approval: ShieldQuestion,
  result: CheckCircle2,
  warn: AlertTriangle,
};

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: "text-muted-foreground",
  tool: "text-primary",
  approval: "text-warning",
  result: "text-success",
  warn: "text-destructive",
};

function time(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

/** Structured run log + placeholder results output for a simulated agent run. */
export function RunLogView({ run, className }: { run?: AgentRun; className?: string }) {
  if (!run) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 text-center",
          className,
        )}
      >
        <CircleDashed className="h-4 w-4 text-muted-foreground" />
        <p className="mt-2 text-[12.5px] font-medium text-foreground">No run yet</p>
        <p className="mt-1 max-w-[280px] text-[11px] text-muted-foreground">
          Pick a context, then run the agent. Steps, tool calls and results stream here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-medium",
            run.status === "completed"
              ? "border-success/30 bg-success/10 text-success"
              : run.status === "waiting_approval"
                ? "border-warning/30 bg-warning/10 text-warning"
                : run.status === "failed"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/10 text-primary",
          )}
        >
          {run.status.replace("_", " ")}
        </span>
        {run.simulation && <span className="chip text-[10px]">simulation</span>}
        <span>run {run.id.slice(-6)}</span>
        {run.contextLabel && <span>· {run.contextLabel}</span>}
        {run.tokens && run.status !== "running" && (
          <span>
            · {run.tokens.input} in / {run.tokens.output} out tokens
          </span>
        )}
        {run.finishedAt && (
          <span>· {((run.finishedAt - run.startedAt) / 1000).toFixed(1)}s</span>
        )}
      </div>

      <ol className="max-h-[280px] space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-muted/30 p-2.5 font-mono text-[11px]">
        {run.logs.map((l) => {
          const Icon = LEVEL_ICON[l.level];
          return (
            <li key={l.id} className="flex items-start gap-2">
              <span className="shrink-0 text-muted-foreground">{time(l.at)}</span>
              <Icon className={cn("mt-[2px] h-3 w-3 shrink-0", LEVEL_CLASS[l.level])} />
              <span className="min-w-0 flex-1 text-foreground/90">
                {l.label}
                {l.detail && (
                  <span className="text-muted-foreground"> — {l.detail}</span>
                )}
                {typeof l.ms === "number" && (
                  <span className="text-muted-foreground"> ({l.ms}ms)</span>
                )}
              </span>
            </li>
          );
        })}
        {run.status === "running" && (
          <li className="flex items-center gap-2 text-muted-foreground">
            <CircleDashed className="h-3 w-3 animate-spin" /> working…
          </li>
        )}
      </ol>

      {run.output && (
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Results (placeholder)
          </div>
          <ul className="mt-1.5 space-y-1">
            {run.output.map((o) => (
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
