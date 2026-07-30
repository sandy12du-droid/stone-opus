import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  icon?: ComponentType<{ className?: string }>;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Consistent surface card with an optional titled header row. */
export function SectionCard({
  title,
  icon: Icon,
  right,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn("card-surface p-5", className)}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {title && (
              <h2 className="truncate text-[13px] font-semibold text-foreground">{title}</h2>
            )}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
