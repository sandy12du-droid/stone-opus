// Projects & Production read layer.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["stone_projects"]["Row"];
export type WorkOrderRow = Database["public"]["Tables"]["stone_work_orders"]["Row"];
export type ProductionEvent = Database["public"]["Tables"]["stone_production_events"]["Row"];

export type ProjectWithWorkOrders = ProjectRow & { work_orders: WorkOrderRow[] };
export type ProjectListItem = ProjectRow & {
  work_orders: Pick<WorkOrderRow, "id" | "stage" | "status">[];
};

export const PROJECT_STATUSES = [
  "planning",
  "in_production",
  "qc",
  "ready_to_ship",
  "shipped",
  "on_hold",
  "completed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  in_production: "In production",
  qc: "Quality control",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  on_hold: "On hold",
  completed: "Completed",
};

export const PROJECT_STATUS_TONE: Record<string, string> = {
  planning: "bg-muted text-foreground",
  in_production: "bg-info/15 text-info",
  qc: "bg-warning/15 text-warning",
  ready_to_ship: "bg-accent/20 text-accent-foreground",
  shipped: "bg-primary/15 text-primary",
  on_hold: "bg-destructive/15 text-destructive",
  completed: "bg-success/15 text-success",
};

export const PRIORITY_TONE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-muted text-foreground",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

export const PRODUCTION_STAGES = [
  "queued",
  "slabbing",
  "cutting",
  "polishing",
  "qc",
  "packaging",
  "ready",
  "shipped",
] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export const STAGE_LABEL: Record<string, string> = {
  queued: "Queued",
  slabbing: "Slabbing",
  cutting: "Cutting",
  polishing: "Polishing",
  qc: "QC",
  packaging: "Packaging",
  ready: "Ready",
  shipped: "Shipped",
};

export const STAGE_TONE: Record<string, string> = {
  queued: "bg-muted text-muted-foreground border-border",
  slabbing: "bg-info/15 text-info border-info/30",
  cutting: "bg-info/15 text-info border-info/30",
  polishing: "bg-warning/15 text-warning border-warning/30",
  qc: "bg-warning/15 text-warning border-warning/30",
  packaging: "bg-accent/20 text-accent-foreground border-accent/40",
  ready: "bg-success/15 text-success border-success/30",
  shipped: "bg-primary/15 text-primary border-primary/30",
};

export function projectProgress(stages: string[]): number {
  if (!stages.length) return 0;
  const idx = stages.map((s) => PRODUCTION_STAGES.indexOf(s as ProductionStage));
  const avg = idx.reduce((a, b) => a + (b < 0 ? 0 : b), 0) / stages.length;
  return Math.round((avg / (PRODUCTION_STAGES.length - 1)) * 100);
}

export const currency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

// ---------- Queries ----------
export const projectsListOptions = () =>
  queryOptions({
    queryKey: ["projects", "list"],
    staleTime: 20_000,
    queryFn: async (): Promise<ProjectListItem[]> => {
      const { data, error } = await supabase
        .from("stone_projects")
        .select("*, work_orders:stone_work_orders(id, stage, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProjectListItem[];
    },
  });

export const projectDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ["projects", "detail", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<ProjectWithWorkOrders | null> => {
      const { data, error } = await supabase
        .from("stone_projects")
        .select("*, work_orders:stone_work_orders(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as ProjectWithWorkOrders | null;
    },
  });

export const productionBoardOptions = () =>
  queryOptions({
    queryKey: ["production", "board"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stone_work_orders")
        .select("*, project:stone_projects(id, code, name, customer_name, priority)")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const productionEventsOptions = (workOrderId: string) =>
  queryOptions({
    queryKey: ["production", "events", workOrderId],
    enabled: Boolean(workOrderId),
    queryFn: async (): Promise<ProductionEvent[]> => {
      const { data, error } = await supabase
        .from("stone_production_events")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
