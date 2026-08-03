import { Sparkles, Plus } from "lucide-react";
import { AGENT_TEMPLATES } from "./templates";

/** Starting points for new agents — scaffolding only, no execution yet. */
export function TemplateGallery() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {AGENT_TEMPLATES.map((t) => (
        <article key={t.id} className="rounded-lg border border-dashed border-border bg-surface p-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-[13px] font-semibold text-foreground">{t.name}</h3>
            <span className="chip ml-auto text-[10px]">{t.domain}</span>
          </div>
          <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{t.description}</p>
          <ul className="mt-2 space-y-0.5">
            {t.tools.map((tool) => (
              <li key={tool.id} className="font-mono text-[10.5px] text-muted-foreground">
                {tool.id}
                {tool.needsApproval && <span className="ml-1 text-warning">· approval</span>}
              </li>
            ))}
          </ul>
          <button
            disabled
            title="Available once the n8n runtime is connected"
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11.5px] font-medium text-muted-foreground disabled:opacity-60"
          >
            <Plus className="h-3 w-3" /> Create from template
          </button>
        </article>
      ))}
    </div>
  );
}
