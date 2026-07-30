import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "primary";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  info: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  primary: "border-primary/30 bg-primary/10 text-primary",
};

const DOT_CLASS: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  primary: "bg-primary",
};

/** Single source of truth for status chips across modules. */
export function StatusPill({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[tone])} />}
      {children}
    </span>
  );
}

export function ToneDot({ tone = "neutral", className }: { tone?: Tone; className?: string }) {
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT_CLASS[tone], className)} />;
}
