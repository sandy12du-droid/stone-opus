/** Agent templates — starting points for new agents (no execution yet). */
import type { AgentTemplate } from "../types";

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "tpl-email-automation",
    name: "Email Automation",
    description: "Drafts, schedules and logs customer email sequences with human sign-off.",
    domain: "crm",
    workflowId: "n8n-wf-template-email-01",
    tools: [
      { id: "crm.read_contact", label: "Read contact" },
      { id: "mail.draft_message", label: "Draft message" },
      { id: "mail.send_message", label: "Send message", needsApproval: true },
    ],
    triggers: ["manual", "event"],
    permissions: ["read", "external_send"],
  },
  {
    id: "tpl-document-generator",
    name: "Document Generator",
    description: "Builds proforma invoices, packing lists and BLs from live records.",
    domain: "documents",
    workflowId: "n8n-wf-template-docs-02",
    tools: [
      { id: "docs.collect_record", label: "Collect source record" },
      { id: "docs.render_pdf", label: "Render document" },
      { id: "docs.publish", label: "Publish to document layer", needsApproval: true },
    ],
    triggers: ["manual", "context"],
    permissions: ["read", "write"],
  },
  {
    id: "tpl-lead-research",
    name: "Lead Research",
    description: "Researches importers, verifies trade data and scores buying power.",
    domain: "crm",
    workflowId: "n8n-wf-template-research-03",
    tools: [
      { id: "research.web_lookup", label: "Web lookup" },
      { id: "research.trade_history", label: "Import history lookup" },
      { id: "crm.create_lead", label: "Create lead", needsApproval: true },
    ],
    triggers: ["scheduled", "manual"],
    permissions: ["read", "write"],
  },
  {
    id: "tpl-shipment-watcher",
    name: "Shipment Watcher",
    description: "Polls carrier milestones and escalates ETA slips to the desk owner.",
    domain: "logistics",
    workflowId: "n8n-wf-template-shipping-04",
    tools: [
      { id: "shipping.poll_carrier", label: "Poll carrier" },
      { id: "shipping.update_eta", label: "Update ETA", needsApproval: true },
      { id: "workspace.notify", label: "Notify desk owner" },
    ],
    triggers: ["scheduled", "event"],
    permissions: ["read", "write", "notify"],
  },
];
