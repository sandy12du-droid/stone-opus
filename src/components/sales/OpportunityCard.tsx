import { Link } from "@tanstack/react-router";
import { Calendar, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { currencyFmt, type Opportunity } from "@/lib/sales-data";

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Link
      to="/sales/opportunities/$opportunityId"
      params={{ opportunityId: opp.id }}
      className="block rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-foreground">{opp.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{opp.flag}</span>
            <span className="truncate">{opp.customer}</span>
          </div>
        </div>
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
            {opp.owner.initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[15px] font-semibold text-foreground">
            {currencyFmt(opp.value, opp.currency)}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {opp.expectedClose}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Prob.</div>
          <div className="text-[12px] font-semibold text-primary">{opp.probability}%</div>
        </div>
      </div>

      {opp.aiSignal && (
        <div className="mt-3 flex items-start gap-1.5 rounded-md bg-accent/10 px-2 py-1.5 text-[10px] text-foreground/80">
          <Sparkles className="mt-px h-3 w-3 shrink-0 text-accent" />
          <span className="line-clamp-2">{opp.aiSignal.text}</span>
        </div>
      )}
    </Link>
  );
}
