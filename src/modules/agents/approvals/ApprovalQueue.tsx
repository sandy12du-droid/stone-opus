import { useState } from "react";
import { Check, Pencil, ShieldQuestion, X, ArrowUpRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useBusinessContext } from "@/context/BusinessContext";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "../types";
import { usePendingApprovalRequests } from "../runtime/store";
import { getAgentService } from "../services/agent-service";

function ApprovalCard({ a, compact }: { a: ApprovalRequest; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const [payload, setPayload] = useState(a.payload);
  const { setEntity } = useBusinessContext();
  const navigate = useNavigate();
  const service = getAgentService();

  return (
    <li className="rounded-md border border-warning/30 bg-warning/5 px-2.5 py-2">
      <div className="text-[12.5px] font-semibold leading-snug text-foreground">
        {a.agentName} · {a.toolLabel}
      </div>
      {!compact && (
        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{a.summary}</div>
      )}
      {!compact && (
        <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[10.5px]">
          {Object.entries(editing ? payload : a.payload).map(([k, v]) => (
            <div key={k} className="flex min-w-0 items-center gap-1">
              <dt className="text-muted-foreground">{k}:</dt>
              {editing ? (
                <input
                  value={v}
                  onChange={(e) => setPayload({ ...payload, [k]: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-border bg-surface px-1 py-0.5 text-foreground"
                  aria-label={`Edit ${k}`}
                />
              ) : (
                <dd className="truncate text-foreground/90">{v}</dd>
              )}
            </div>
          ))}
        </dl>
      )}
      {editing && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for the edit (optional)"
          className="mt-1.5 w-full rounded border border-border bg-surface px-1.5 py-1 text-[11px]"
        />
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() =>
            service.resolveApproval(a.id, editing ? "edited" : "approved", {
              note: note || undefined,
              editedPayload: editing ? payload : undefined,
            })
          }
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
        >
          <Check className="h-3 w-3" /> {editing ? "Approve edited" : "Approve"}
        </button>
        {!compact && (
          <button
            onClick={() => setEditing((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium",
              editing ? "bg-surface-muted text-foreground" : "bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
        <button
          onClick={() => service.resolveApproval(a.id, "rejected", { note: note || undefined })}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Reject
        </button>
        {a.entity?.href && (
          <button
            onClick={() => {
              setEntity(a.entity!);
              navigate({ to: a.entity!.href! });
            }}
            className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
          >
            Open <ArrowUpRight className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    </li>
  );
}

/** Approval queue: approve / edit / reject a paused agent step. */
export function ApprovalQueue({ compact = false }: { compact?: boolean }) {
  const pending = usePendingApprovalRequests();
  if (pending.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-warning">
          <ShieldQuestion className="h-3 w-3" /> Agent approvals
        </div>
        <div className="text-[10px] text-muted-foreground">{pending.length}</div>
      </div>
      <ul className="space-y-1.5">
        {pending.map((a) => (
          <ApprovalCard key={a.id} a={a} compact={compact} />
        ))}
      </ul>
    </div>
  );
}
