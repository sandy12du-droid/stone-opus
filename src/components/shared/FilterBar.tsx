import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  value: string;
  label: string;
  count?: number;
}

/** Search input + chip filters + optional trailing controls (view switch, etc.). */
export function FilterBar({
  query,
  onQueryChange,
  placeholder = "Search…",
  chips,
  activeChip,
  onChipChange,
  right,
  className,
}: {
  query?: string;
  onQueryChange?: (v: string) => void;
  placeholder?: string;
  chips?: FilterChip[];
  activeChip?: string;
  onChipChange?: (v: string) => void;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {onQueryChange && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query ?? ""}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-9 w-full rounded-md border border-border bg-surface pl-8 pr-3 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
          />
        </div>
      )}

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filters">
          {chips.map((c) => {
            const active = c.value === activeChip;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChipChange?.(c.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {c.label}
                {typeof c.count === "number" && (
                  <span className="ml-1.5 text-[11px] opacity-70">{c.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
