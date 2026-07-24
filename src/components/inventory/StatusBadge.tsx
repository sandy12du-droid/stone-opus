import { cn } from "@/lib/utils";
import { LEVEL_TONE, SLAB_STATUS_TONE, type SlabStatus, type StockLevel } from "@/lib/inventory-queries";

export function StockLevelBadge({ level, className }: { level: StockLevel; className?: string }) {
  const t = LEVEL_TONE[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        t.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />
      {t.label}
    </span>
  );
}

export function SlabStatusBadge({ status, className }: { status: SlabStatus; className?: string }) {
  const t = SLAB_STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
        t.className,
        className,
      )}
    >
      {t.label}
    </span>
  );
}
