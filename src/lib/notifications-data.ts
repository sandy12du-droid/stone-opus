/**
 * Step 7 — Notification Center
 *
 * Cross-module notification feed. Frontend-only for now:
 * - Grouped by category (Approvals, Inventory, Shipping, Follow-ups, AI, System)
 * - Per-item severity (info / success / warning / danger)
 * - Optional entity link so a click can switch Global Business Context
 * - Read/unread state persisted to localStorage per session
 *
 * Real-time wiring to Supabase happens later; the shape is stable.
 */

import type { BusinessEntity } from "@/context/BusinessContext";

export type NotificationCategory =
  | "approvals"
  | "inventory"
  | "shipping"
  | "followups"
  | "ai"
  | "system";

export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  tone: NotificationTone;
  title: string;
  body?: string;
  /** Relative label e.g. "12m", "2h", "Yesterday" */
  time: string;
  /** ISO timestamp — used for sorting */
  ts: string;
  /** Optional linked business entity — clicking sets Global Business Context */
  entity?: BusinessEntity;
}

export const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; hint: string }
> = {
  approvals: { label: "Approvals", hint: "Quotes and orders waiting for you" },
  inventory: { label: "Inventory", hint: "Stock levels & reservations" },
  shipping: { label: "Shipping", hint: "Containers & milestones" },
  followups: { label: "Follow-ups", hint: "Leads & customer touch-points" },
  ai: { label: "AI", hint: "Suggestions from Arquane agents" },
  system: { label: "System", hint: "Platform & workspace events" },
};

/* ------------------------------------------------------------------ */

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
const rel = (mins: number) => {
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  const d = Math.round(mins / (60 * 24));
  return d === 1 ? "Yesterday" : `${d}d`;
};

const seed = [
  {
    id: "n-1",
    category: "approvals" as const,
    tone: "warning" as const,
    title: "Q-2418 waiting on your approval",
    body: "ABC Stone · $184,200 — margin below floor by 1.2%",
    mins: 12,
    entity: {
      kind: "quotation" as const,
      id: "Q-2418",
      label: "Q-2418",
      sublabel: "ABC Stone",
      href: "/quotations",
    },
  },
  {
    id: "n-2",
    category: "inventory" as const,
    tone: "warning" as const,
    title: "Statuario Extra 20mm below threshold",
    body: "Port Klang WH · 42 slabs remaining (min 60)",
    mins: 55,
    entity: {
      kind: "inventory" as const,
      id: "statuario-extra-20",
      label: "Statuario Extra 20mm",
      sublabel: "Port Klang",
      href: "/inventory/products",
    },
  },
  {
    id: "n-3",
    category: "shipping" as const,
    tone: "info" as const,
    title: "CNT-0091 dispatched from Livorno",
    body: "ETA Houston · Feb 14 · MSC Logistics",
    mins: 180,
    entity: {
      kind: "container" as const,
      id: "CNT-0091",
      label: "CNT-0091",
      sublabel: "Livorno → Houston",
      href: "/shipping",
    },
  },
  {
    id: "n-4",
    category: "followups" as const,
    tone: "warning" as const,
    title: "3 warm leads not contacted in 5+ days",
    body: "Concord Stoneworks, Nordic Slab Co., Al-Manar Interiors",
    mins: 240,
  },
  {
    id: "n-5",
    category: "ai" as const,
    tone: "info" as const,
    title: "Quote Coach: bundle opportunity",
    body: "Riverside Kitchens likely to accept Calacatta Oro + edge polish",
    mins: 300,
    entity: {
      kind: "customer" as const,
      id: "riverside-kitchens",
      label: "Riverside Kitchens",
      sublabel: "Customer · United States",
      href: "/crm/customers",
    },
  },
  {
    id: "n-6",
    category: "approvals" as const,
    tone: "danger" as const,
    title: "PO-3391 blocked — credit hold",
    body: "Doha Interiors exceeded credit limit by $28k",
    mins: 420,
    entity: {
      kind: "order" as const,
      id: "PO-3391",
      label: "PO-3391",
      sublabel: "Doha Interiors",
      href: "/quotations",
    },
  },
  {
    id: "n-7",
    category: "shipping" as const,
    tone: "danger" as const,
    title: "CNT-0088 delayed at Suez",
    body: "New ETA slipped by 4 days · notify 2 customers",
    mins: 600,
  },
  {
    id: "n-8",
    category: "ai" as const,
    tone: "success" as const,
    title: "Lead Enricher completed run",
    body: "12 new leads scored · 3 flagged as high intent",
    mins: 720,
  },
  {
    id: "n-9",
    category: "system" as const,
    tone: "info" as const,
    title: "Weekly executive report ready",
    body: "Revenue, pipeline, and inventory summary for W-06",
    mins: 60 * 26,
  },
  {
    id: "n-10",
    category: "inventory" as const,
    tone: "success" as const,
    title: "1 container of Calacatta Gold received",
    body: "Port Klang WH · 68 slabs added to available stock",
    mins: 60 * 30,
  },
];

export const notifications: AppNotification[] = seed.map((s) => ({
  id: s.id,
  category: s.category,
  tone: s.tone,
  title: s.title,
  body: s.body,
  ts: ago(s.mins),
  time: rel(s.mins),
  entity: s.entity,
}));

export function groupByCategory(items: AppNotification[]) {
  const groups: Partial<Record<NotificationCategory, AppNotification[]>> = {};
  for (const n of items) {
    (groups[n.category] ||= []).push(n);
  }
  return groups;
}
