// AI Awareness helpers.
//
// Given the Global Business Context (active customer, project, quotation,
// inventory item, container, order, or lead), return context-aware:
//   • suggested prompts
//   • sample insight
//   • knowledge documents "in context"
//
// This is a presentation layer — no AI calls, no side effects. When an AI
// agent is later wired in, it can consume the same active entities via
// `useBusinessContext()` and these hints stay in sync.

import type {
  BusinessEntity,
  BusinessEntityKind,
} from "@/context/BusinessContext";

export interface AiSuggestions {
  /** Short label describing what the AI is focused on right now. */
  focusLabel: string;
  /** Ordered prompts to surface (chat suggestions, right-rail prompts). */
  prompts: string[];
  /** One-liner insight tailored to the active entity. */
  insight: { title: string; body: string };
  /** Knowledge docs the AI would ground against for this entity. */
  knowledge: string[];
}

const GENERIC: AiSuggestions = {
  focusLabel: "Whole business",
  prompts: [
    "Summarize this week's pipeline",
    "Show inventory below 10 slabs",
    "Find delayed shipments",
    "Draft follow-up email to warm leads",
    "Which quotations are pending approval?",
  ],
  insight: {
    title: "Quartz demand in Texas up 18% MoM",
    body: "Enrich importer list and prioritize 4 warm accounts.",
  },
  knowledge: [
    "Arquane price book — 2025 Q3",
    "Global importer directory · v14",
    "Incoterms cheat sheet",
  ],
};

function forCustomer(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Customer · ${e.label}`,
    prompts: [
      `Summarize ${e.label}'s last 12 months`,
      `Draft a follow-up email to ${e.label}`,
      `Which SKUs does ${e.label} buy most?`,
      `Suggest a bundle quotation for ${e.label}`,
      `Show open shipments for ${e.label}`,
    ],
    insight: {
      title: `${e.label} — next best action`,
      body: `2 quotations pending and 1 container in transit. A follow-up now typically lifts close rate ~14%.`,
    },
    knowledge: [
      `${e.label} — account plan`,
      "Arquane price book — 2025 Q3",
      "Customer segmentation playbook",
    ],
  };
}

function forLead(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Lead · ${e.label}`,
    prompts: [
      `Enrich lead: ${e.label}`,
      `Draft cold outreach to ${e.label}`,
      `Score buying intent for ${e.label}`,
      `Find similar accounts to ${e.label}`,
    ],
    insight: {
      title: `${e.label} — enrichment ready`,
      body: `Import history and firmographics available. Score once to prioritize this week.`,
    },
    knowledge: [
      "Global importer directory · v14",
      "Cold outreach templates",
      "Lead scoring rubric",
    ],
  };
}

function forProject(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Project · ${e.label}`,
    prompts: [
      `What's slowing ${e.label}?`,
      `Generate a cut list for ${e.label}`,
      `Show open work orders on ${e.label}`,
      `Draft a status update for ${e.label}`,
    ],
    insight: {
      title: `${e.label} — throughput check`,
      body: `Two stages exceed target cycle time. Rebalancing could recover ~2 days.`,
    },
    knowledge: [
      "Production SOP — slabs to install",
      "Shop drawing conventions",
      "QC checklist",
    ],
  };
}

function forQuotation(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Quotation · ${e.label}`,
    prompts: [
      `Suggest bundles for ${e.label}`,
      `Rewrite ${e.label} for a Platinum tier customer`,
      `Compare landed cost for ${e.label} across Livorno/Newark/Chennai`,
      `Draft a polite follow-up on ${e.label}`,
    ],
    insight: {
      title: `${e.label} — margin & close`,
      body: `Currently 3pts below segment median. A small bundle could keep margin and improve close probability.`,
    },
    knowledge: [
      "Arquane price book — 2025 Q3",
      "Incoterms cheat sheet",
      "Quote Coach — approved language",
    ],
  };
}

function forInventory(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Inventory · ${e.label}`,
    prompts: [
      `Which customers usually buy ${e.label}?`,
      `Suggest a reprice for ${e.label}`,
      `Find open quotations mentioning ${e.label}`,
      `Draft a marketing blurb for ${e.label}`,
    ],
    insight: {
      title: `${e.label} — pricing & demand`,
      body: `Sell-through above average this quarter. Consider a modest list increase or hedge the next PO.`,
    },
    knowledge: [
      "Arquane price book — 2025 Q3",
      "Stone care & install guide",
      "Warehouse SOPs",
    ],
  };
}

function forContainer(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Container · ${e.label}`,
    prompts: [
      `What POs are on ${e.label}?`,
      `Draft an ETA update for customers on ${e.label}`,
      `Estimate demurrage risk for ${e.label}`,
      `Consolidate pending POs into ${e.label}`,
    ],
    insight: {
      title: `${e.label} — freight optimization`,
      body: `Consolidating 4 pending POs could cut per-sqft freight ~11%.`,
    },
    knowledge: [
      "Container loading templates",
      "Incoterms cheat sheet",
      "Freight rate sheet — Q3",
    ],
  };
}

function forOrder(e: BusinessEntity): AiSuggestions {
  return {
    focusLabel: `Opportunity · ${e.label}`,
    prompts: [
      `Next best action for ${e.label}`,
      `Draft a proposal deck for ${e.label}`,
      `Summarize activity on ${e.label}`,
      `Forecast close probability for ${e.label}`,
    ],
    insight: {
      title: `${e.label} — stage momentum`,
      body: `Stalled 6 days in current stage. A stakeholder mapping call typically breaks this pattern.`,
    },
    knowledge: [
      "Sales playbook — enterprise",
      "Mutual close plan template",
      "Objection handling — pricing",
    ],
  };
}

const RESOLVERS: Record<BusinessEntityKind, (e: BusinessEntity) => AiSuggestions> = {
  customer: forCustomer,
  lead: forLead,
  project: forProject,
  quotation: forQuotation,
  inventory: forInventory,
  container: forContainer,
  order: forOrder,
};

/**
 * Priority order when multiple entities are active. Most specific /
 * time-sensitive entity wins.
 */
const PRIORITY: BusinessEntityKind[] = [
  "quotation",
  "order",
  "project",
  "container",
  "inventory",
  "customer",
  "lead",
];

export function getAiSuggestions(
  active: Partial<Record<BusinessEntityKind, BusinessEntity>>,
): AiSuggestions & { primary: BusinessEntity | null } {
  for (const kind of PRIORITY) {
    const entity = active[kind];
    if (entity) {
      return { ...RESOLVERS[kind](entity), primary: entity };
    }
  }
  return { ...GENERIC, primary: null };
}
