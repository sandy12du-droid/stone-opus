import type { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets?: string[];
}

export function ModulePlaceholder({ icon: Icon, title, description, bullets }: ModulePlaceholderProps) {
  return (
    <div className="card-surface flex flex-col items-start gap-4 p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {bullets && bullets.length > 0 && (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground/90"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Module scaffolded — awaiting build
      </div>
    </div>
  );
}
