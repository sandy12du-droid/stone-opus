// Arquane OS — AI Agent Architecture (declarative layer, no model calls yet).
//
// Every agent is described here as data: what domain it serves, which
// business-context entities it can act on, which tools it is allowed to call,
// how it can be triggered, and what guardrails apply. UI surfaces (AI Command
// Center, Right Rail, module pages) read this registry instead of hardcoding
// agent lists, so wiring real execution later is a single swap.

import type { BusinessEntityKind } from "@/context/BusinessContext";

export type AgentStatus = "active" | "beta" | "draft";
export type AgentDomain =
  | "sales"
  | "crm"
  | "inventory"
  | "pricing"
  | "logistics"
  | "production"
  | "documents"
  | "executive";

export type AgentTrigger = "manual" | "context" | "scheduled" | "event";

export interface AgentTool {
  /** Namespaced tool id, e.g. "crm.enrich_lead". */
  id: string;
  label: string;
  /** Whether a human must approve before the tool mutates data. */
  needsApproval?: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  domain: AgentDomain;
  status: AgentStatus;
  /** Business-context entity kinds this agent understands. */
  scopes: BusinessEntityKind[];
  tools: AgentTool[];
  triggers: AgentTrigger[];
  /** Operating limits surfaced in the UI. */
  guardrails: string[];
  /** Example instructions a user can launch the agent with. */
  samplePrompts: string[];
  runs30d: number;
}

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: "lead-enricher",
    name: "Lead Enricher",
    role: "Verifies emails, matches import history, scores buying power",
    domain: "crm",
    status: "active",
    scopes: ["lead", "customer"],
    tools: [
      { id: "crm.search_leads", label: "Search leads" },
      { id: "crm.enrich_company", label: "Enrich company profile" },
      { id: "crm.update_lead", label: "Update lead", needsApproval: true },
    ],
    triggers: ["manual", "context", "scheduled"],
    guardrails: ["Never emails a contact directly", "Score changes require review"],
    samplePrompts: [
      "Enrich all new leads from the Texas import list",
      "Score this lead's buying power",
    ],
    runs30d: 214,
  },
  {
    id: "quote-coach",
    name: "Quote Coach",
    role: "Suggests bundles, incoterms, and follow-up cadence",
    domain: "sales",
    status: "active",
    scopes: ["quotation", "customer", "order"],
    tools: [
      { id: "quotes.read_quotation", label: "Read quotation" },
      { id: "inventory.find_substitutes", label: "Find substitute slabs" },
      { id: "quotes.suggest_terms", label: "Suggest terms" },
      { id: "quotes.draft_followup", label: "Draft follow-up", needsApproval: true },
    ],
    triggers: ["manual", "context"],
    guardrails: ["Cannot price below the margin floor", "Drafts only — never sends"],
    samplePrompts: [
      "Suggest a bundle for this quotation",
      "What incoterms fit this customer's region?",
    ],
    runs30d: 96,
  },
  {
    id: "logistics-planner",
    name: "Logistics Planner",
    role: "Consolidates POs into containers and books freight",
    domain: "logistics",
    status: "active",
    scopes: ["container", "order", "project"],
    tools: [
      { id: "shipping.list_open_orders", label: "List open orders" },
      { id: "shipping.calculate_loading", label: "Calculate loading plan" },
      { id: "shipping.book_container", label: "Book container", needsApproval: true },
    ],
    triggers: ["manual", "context", "event"],
    guardrails: ["Respects container weight and volume limits", "Bookings need approval"],
    samplePrompts: [
      "Calculate the loading plan for CNT-0092",
      "Which open POs can consolidate this week?",
    ],
    runs30d: 41,
  },
  {
    id: "pricing-advisor",
    name: "Pricing Advisor",
    role: "Watches FX, market averages, and margin floors",
    domain: "pricing",
    status: "active",
    scopes: ["inventory", "quotation", "customer"],
    tools: [
      { id: "pricing.read_price_book", label: "Read price book" },
      { id: "pricing.market_benchmark", label: "Benchmark market price" },
      { id: "pricing.propose_update", label: "Propose price update", needsApproval: true },
    ],
    triggers: ["scheduled", "context", "event"],
    guardrails: ["Never writes list prices directly", "Alerts when margin < floor"],
    samplePrompts: ["Is Calacatta Oro priced correctly?", "Show items below margin floor"],
    runs30d: 58,
  },
  {
    id: "production-monitor",
    name: "Production Monitor",
    role: "Tracks work orders, flags slipping stages and capacity risk",
    domain: "production",
    status: "beta",
    scopes: ["project", "order"],
    tools: [
      { id: "production.read_work_orders", label: "Read work orders" },
      { id: "production.flag_delay", label: "Flag delay" },
      { id: "production.suggest_resequence", label: "Suggest resequencing", needsApproval: true },
    ],
    triggers: ["scheduled", "event", "context"],
    guardrails: ["Read-only on the shop floor board", "Escalates instead of rescheduling"],
    samplePrompts: ["Which work orders are slipping?", "Generate a cut list for this project"],
    runs30d: 27,
  },
  {
    id: "ceo-agent",
    name: "CEO Agent",
    role: "Daily digest and cross-domain recommendations",
    domain: "executive",
    status: "beta",
    scopes: ["customer", "lead", "project", "quotation", "inventory", "container", "order"],
    tools: [
      { id: "reports.read_kpis", label: "Read KPIs" },
      { id: "reports.detect_anomalies", label: "Detect anomalies" },
      { id: "workspace.publish_digest", label: "Publish digest", needsApproval: true },
    ],
    triggers: ["scheduled", "manual"],
    guardrails: ["Aggregated data only", "No customer-facing output"],
    samplePrompts: ["Give me this morning's briefing", "What changed since yesterday?"],
    runs30d: 12,
  },
];

export const TRIGGER_LABEL: Record<AgentTrigger, string> = {
  manual: "Manual",
  context: "Context-aware",
  scheduled: "Scheduled",
  event: "Event-driven",
};

export function getAgent(id: string) {
  return AGENT_REGISTRY.find((a) => a.id === id);
}

/** Agents that can operate on the currently active business entity. */
export function agentsForScope(kind?: BusinessEntityKind | null) {
  if (!kind) return [];
  return AGENT_REGISTRY.filter((a) => a.scopes.includes(kind));
}
