// Reusable Activity Timeline. Used across Customer, Project, Order, Quotation,
// Inventory and Shipping workspaces. Presentation only — event data is passed in.

import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  MessageSquare,
  FileText,
  Mail,
  CheckCircle2,
  ArrowRightLeft,
  type LucideIcon,
} from "lucide-react";

export type ActivityKind =
  | "created"
  | "updated"
  | "comment"
  | "document"
  | "email"
  | "task"
  | "status";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  actor?: string;
  at: string; // ISO or human string
  meta?: string;
}

const KIND_META: Record<ActivityKind, { icon: LucideIcon; tone: string; label: string }> = {
  created:  { icon: Plus,           tone: "bg-primary/10 text-primary",           label: "Created" },
  updated:  { icon: Pencil,         tone: "bg-muted text-muted-foreground",       label: "Updated" },
  comment:  { icon: MessageSquare,  tone: "bg-info/10 text-info",                 label: "Comment" },
  document: { icon: FileText,       tone: "bg-accent/15 text-accent-foreground",  label: "Document" },
  email:    { icon: Mail,           tone: "bg-primary/10 text-primary",           label: "Email" },
  task:     { icon: CheckCircle2,   tone: "bg-success/10 text-success",           label: "Task" },
  status:   { icon: ArrowRightLeft, tone: "bg-warning/10 text-warning",           label: "Status" },
};

export interface ActivityTimelineProps {
  events: ActivityEvent[];
  emptyLabel?: string;
  className?: string;
}

export function ActivityTimeline({ events, emptyLabel = "No activity yet.", className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>;
  }
  return (
    <ol className={cn("relative space-y-4", className)}>
      <div className="absolute left-[15px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {events.map((e) => {
        const meta = KIND_META[e.kind];
        const Icon = meta.icon;
        return (
          <li key={e.id} className="relative flex gap-3">
            <div className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-background", meta.tone)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[13px] font-medium text-foreground">{e.title}</span>
                {e.meta && <span className="text-[11px] text-muted-foreground">· {e.meta}</span>}
              </div>
              {e.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                {e.actor && <span>{e.actor}</span>}
                {e.actor && <span aria-hidden>·</span>}
                <span>{e.at}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
