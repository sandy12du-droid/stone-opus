import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type Trend = "up" | "down" | "flat";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: Trend;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

/** Compact KPI tile used across Workspace, Dashboard and module hubs. */
export function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  hint,
  icon: Icon,
  className,
}: StatCardProps) {
  const trendColor =
    trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className={cn("card-surface p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-soft text-primary">
            <Icon className="h-3 w-3" />
          </div>
        )}
      </div>
      <div className="mt-2 text-[20px] font-semibold tracking-tight text-foreground">{value}</div>
      {(delta || hint) && (
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px]">
          {delta && <span className={cn("font-medium", trendColor)}>{delta}</span>}
          {hint && <span className="truncate text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
