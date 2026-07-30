import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  className?: string;
}

/** Consistent zero-data state for lists, boards and panels. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[13px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
