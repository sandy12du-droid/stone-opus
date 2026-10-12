import type { ExecutionLogEntry, LogLevel } from "../types";

const TONE: Record<LogLevel, string> = { info: "text-muted-foreground", tool: "text-primary", approval: "text-accent", result: "text-success", warn: "text-warning", error: "text-destructive" };

export function LogStream({ logs, live }: { logs: ExecutionLogEntry[]; live?: boolean }) {
  return <div className="max-h-96 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
    {logs.length === 0 && <p className="text-muted-foreground">No log entries yet.</p>}
    {logs.map(l => <div key={l.id} className="flex gap-3 py-0.5">
      <span className="shrink-0 text-muted-foreground">{new Date(l.at).toISOString().slice(11, 19)}</span>
      <span className={`w-16 shrink-0 uppercase ${TONE[l.level]}`}>{l.level}</span>
      <span className="min-w-0 break-words">{l.label}{l.detail && <span className="text-muted-foreground"> — {l.detail}</span>}{l.ms != null && <span className="text-muted-foreground"> ({l.ms}ms)</span>}</span>
    </div>)}
    {live && <p className="animate-pulse pt-1 text-primary">● live</p>}
  </div>;
}
