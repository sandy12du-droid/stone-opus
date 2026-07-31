import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Check, ShieldQuestion, X } from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";
import { resolveApproval, usePendingApprovals } from "@/lib/agent-runtime";

/**
 * Pending agent tool approvals, rendered at the top of the Approvals feed.
 * Approving/denying resolves the paused agent run.
 */
export function AgentApprovalsFeed({ compact = false }: { compact?: boolean }) {
  const pending = usePendingApprovals();
  const { setEntity } = useBusinessContext();
  const navigate = useNavigate();

  if (pending.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-warning">
          <ShieldQuestion className="h-3 w-3" /> Agent tool approvals
        </div>
        <div className="text-[10px] text-muted-foreground">{pending.length}</div>
      </div>
      <ul className="space-y-1.5">
        {pending.map((a) => (
          <li
            key={a.id}
            className="rounded-md border border-warning/30 bg-warning/5 px-2.5 py-2"
          >
            <div className="text-[12.5px] font-semibold leading-snug text-foreground">
              {a.agentName} · {a.toolLabel}
            </div>
            {!compact && (
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {a.summary}
              </div>
            )}
            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                onClick={() => resolveApproval(a.id, "approved")}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
              >
                <Check className="h-3 w-3" /> Approve
              </button>
              <button
                onClick={() => resolveApproval(a.id, "denied")}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Deny
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
        ))}
      </ul>
    </div>
  );
}
