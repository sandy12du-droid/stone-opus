import { cn } from "@/lib/utils";

/** Skeleton rows for list/table loading. */
export function LoadingRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-surface-muted" />
      ))}
    </div>
  );
}

/** Skeleton grid for card layouts. */
export function LoadingCards({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-muted" />
      ))}
    </div>
  );
}
