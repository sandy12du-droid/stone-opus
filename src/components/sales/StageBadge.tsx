import { cn } from "@/lib/utils";
import { STAGE_TONE, type SalesStage } from "@/lib/sales-data";

export function StageBadge({ stage, className }: { stage: SalesStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STAGE_TONE[stage],
        className,
      )}
    >
      {stage}
    </span>
  );
}
