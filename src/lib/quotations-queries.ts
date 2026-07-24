// Quotations read layer — public catalogue-style reads via the browser client.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type QuotationRow  = Database["public"]["Tables"]["stone_quotations"]["Row"];
export type QuotationItem = Database["public"]["Tables"]["stone_quotation_items"]["Row"];
export type QuotationEvent = Database["public"]["Tables"]["stone_quotation_events"]["Row"];
export type QuotationStatus = Database["public"]["Enums"]["quotation_status"];

export type QuotationWithItems = QuotationRow & {
  items: QuotationItem[];
  events: QuotationEvent[];
};

export type QuotationListItem = QuotationRow & {
  items: Pick<QuotationItem, "id" | "quantity" | "line_total">[];
};

export const quotationsListOptions = () =>
  queryOptions({
    queryKey: ["quotations", "list"],
    staleTime: 15_000,
    queryFn: async (): Promise<QuotationListItem[]> => {
      const { data, error } = await supabase
        .from("stone_quotations")
        .select("*, items:stone_quotation_items(id, quantity, line_total)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as QuotationListItem[];
    },
  });

export const quotationDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ["quotations", "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<QuotationWithItems | null> => {
      const { data, error } = await supabase
        .from("stone_quotations")
        .select(`
          *,
          items:stone_quotation_items(*),
          events:stone_quotation_events(*)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const withOrder = data as unknown as QuotationWithItems;
      withOrder.items = [...(withOrder.items ?? [])].sort((a, b) => a.position - b.position);
      withOrder.events = [...(withOrder.events ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return withOrder;
    },
  });

// -------- Semantic tone map --------
export const QUOTATION_STATUS_TONE: Record<
  QuotationStatus,
  { label: string; className: string; dot: string }
> = {
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground border-border",           dot: "bg-muted-foreground" },
  in_review: { label: "In review", className: "bg-info/10 text-info border-info/25",                    dot: "bg-info" },
  sent:      { label: "Sent",      className: "bg-primary/10 text-primary border-primary/25",          dot: "bg-primary" },
  accepted:  { label: "Accepted",  className: "bg-success/10 text-success border-success/25",          dot: "bg-success" },
  rejected:  { label: "Rejected",  className: "bg-destructive/10 text-destructive border-destructive/25", dot: "bg-destructive" },
  expired:   { label: "Expired",   className: "bg-warning/10 text-warning border-warning/25",          dot: "bg-warning" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border",          dot: "bg-muted-foreground" },
};

export const WORKFLOW_STEPS: { key: QuotationStatus; label: string }[] = [
  { key: "draft",     label: "Draft" },
  { key: "in_review", label: "In review" },
  { key: "sent",      label: "Sent" },
  { key: "accepted",  label: "Accepted" },
];

export const currency = (n: number, ccy = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
