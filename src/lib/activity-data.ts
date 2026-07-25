// Cross-module Activity Feed data.
//
// Presentation-layer mock data keyed by entity kind + id. When the active
// Global Business Context changes, consumers (RightRail, workspaces) can
// call `getActivityFor(entity)` to render a unified timeline of what has
// happened to that entity across the whole application.
//
// Fallback: when no entity is active, `getGlobalActivity()` returns a
// workspace-wide feed.

import type {
  ActivityEvent,
  ActivityKind,
} from "@/components/ActivityTimeline";
import type {
  BusinessEntity,
  BusinessEntityKind,
} from "@/context/BusinessContext";

type Seed = Omit<ActivityEvent, "id"> & { kind: ActivityKind };

function build(prefix: string, seeds: Seed[]): ActivityEvent[] {
  return seeds.map((s, i) => ({ id: `${prefix}-${i}`, ...s }));
}

const GLOBAL: ActivityEvent[] = build("global", [
  { kind: "status",   title: "CNT-0092 marked in transit",              actor: "Logistics",   at: "12m ago", meta: "Shipping" },
  { kind: "document", title: "Quotation Q-2418 sent to Riverside Kitchens", actor: "Sofia Marin", at: "34m ago", meta: "Quotations" },
  { kind: "email",    title: "Follow-up sent to Al Habtoor Marble",      actor: "Priya Nair",  at: "1h ago",  meta: "CRM" },
  { kind: "task",     title: "PRJ-121 advanced to Fabrication",          actor: "David Ono",   at: "2h ago",  meta: "Production" },
  { kind: "updated",  title: "Statuario Extra list price +$18/sqft",     actor: "Pricing bot", at: "3h ago",  meta: "Inventory" },
  { kind: "comment",  title: "Concord Stoneworks reviewed pricing page", actor: "System",      at: "5h ago",  meta: "CRM" },
  { kind: "created",  title: "Lead added — Bay Area Countertops",        actor: "Sofia Marin", at: "8h ago",  meta: "CRM" },
]);

const BY_KIND: Record<BusinessEntityKind, (e: BusinessEntity) => ActivityEvent[]> = {
  customer: (e) => build(`cust-${e.id}`, [
    { kind: "email",    title: `Follow-up sent to ${e.label}`,      actor: "Sofia Marin", at: "1h ago",  meta: "CRM" },
    { kind: "document", title: `Quotation drafted for ${e.label}`,  actor: "Quote Coach", at: "3h ago",  meta: "Quotations" },
    { kind: "status",   title: `Container booked for ${e.label}`,   actor: "Logistics",   at: "1d ago",  meta: "Shipping" },
    { kind: "comment",  title: `Call notes logged`,                 actor: "David Ono",   at: "2d ago",  meta: "CRM" },
    { kind: "created",  title: `${e.label} added to Platinum tier`, actor: "System",      at: "1w ago",  meta: "CRM" },
  ]),
  lead: (e) => build(`lead-${e.id}`, [
    { kind: "created", title: `Lead created — ${e.label}`,         actor: "Import",       at: "2h ago", meta: "CRM" },
    { kind: "updated", title: `Enriched by Lead Enricher (score 74)`, actor: "Lead Enricher", at: "2h ago", meta: "AI" },
    { kind: "email",   title: `Intro sequence queued`,             actor: "Sofia Marin",  at: "4h ago", meta: "CRM" },
  ]),
  project: (e) => build(`proj-${e.id}`, [
    { kind: "status",  title: `${e.label} advanced to Fabrication`, actor: "David Ono",  at: "2h ago",  meta: "Production" },
    { kind: "task",    title: `Work order WO-0421 completed`,       actor: "Shop floor", at: "6h ago",  meta: "Production" },
    { kind: "document",title: `Shop drawings uploaded`,             actor: "Priya Nair", at: "1d ago",  meta: "Documents" },
    { kind: "created", title: `${e.label} kicked off`,              actor: "Sofia Marin",at: "2w ago",  meta: "Projects" },
  ]),
  quotation: (e) => build(`quot-${e.id}`, [
    { kind: "document",title: `${e.label} sent to customer`,        actor: "Sofia Marin", at: "34m ago", meta: "Quotations" },
    { kind: "updated", title: `Bundle discount applied`,            actor: "Quote Coach", at: "1h ago",  meta: "AI" },
    { kind: "comment", title: `Approved by sales manager`,          actor: "David Ono",   at: "3h ago",  meta: "Quotations" },
    { kind: "created", title: `${e.label} drafted`,                 actor: "Sofia Marin", at: "6h ago",  meta: "Quotations" },
  ]),
  inventory: (e) => build(`inv-${e.id}`, [
    { kind: "updated", title: `${e.label} list price +$18/sqft`,    actor: "Pricing bot", at: "3h ago",  meta: "Pricing" },
    { kind: "status",  title: `4 slabs reserved for Q-2418`,        actor: "System",      at: "5h ago",  meta: "Inventory" },
    { kind: "document",title: `New batch photos uploaded`,          actor: "Warehouse",   at: "1d ago",  meta: "Inventory" },
    { kind: "created", title: `${e.label} received at Livorno`,     actor: "Warehouse",   at: "2w ago",  meta: "Inventory" },
  ]),
  container: (e) => build(`cnt-${e.id}`, [
    { kind: "status",  title: `${e.label} marked in transit`,       actor: "Logistics",   at: "12m ago", meta: "Shipping" },
    { kind: "document",title: `Bill of lading uploaded`,            actor: "Logistics",   at: "1d ago",  meta: "Documents" },
    { kind: "updated", title: `ETA revised — arriving Tue`,         actor: "Carrier feed",at: "2d ago",  meta: "Shipping" },
    { kind: "created", title: `${e.label} booked with carrier`,     actor: "Priya Nair",  at: "1w ago",  meta: "Shipping" },
  ]),
  order: (e) => build(`opp-${e.id}`, [
    { kind: "status",  title: `${e.label} advanced to Negotiation`, actor: "Sofia Marin", at: "1h ago",  meta: "Sales" },
    { kind: "comment", title: `Stakeholder mapping added`,          actor: "David Ono",   at: "1d ago",  meta: "Sales" },
    { kind: "document",title: `Proposal deck attached`,             actor: "Sofia Marin", at: "2d ago",  meta: "Documents" },
    { kind: "created", title: `Opportunity created`,                actor: "Sofia Marin", at: "3w ago",  meta: "Sales" },
  ]),
};

export function getActivityFor(entity: BusinessEntity): ActivityEvent[] {
  return BY_KIND[entity.kind](entity);
}

export function getGlobalActivity(): ActivityEvent[] {
  return GLOBAL;
}
