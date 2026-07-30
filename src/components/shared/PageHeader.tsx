import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/** Standard module page header: eyebrow + H1 + subtitle + right-side actions. */
export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 truncate text-[22px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
