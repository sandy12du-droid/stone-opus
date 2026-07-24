import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/crm/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Arquane OS" },
      { name: "description", content: "Global lead pipeline for the stone industry." },
      { property: "og:title", content: "Leads — Arquane OS" },
      { property: "og:description", content: "Global lead pipeline for the stone industry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell
      title="Leads"
      subtitle="Scored global pipeline enriched with import history and AI recommendations."
      actions={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">New lead</Button>}
    >
      <ModulePlaceholder
        icon={UserPlus}
        title="Lead workspace scaffolded"
        description="Rich lead cards with score, country, industry, decision maker, source, and import history."
        bullets={[
          "Kanban and table view",
          "Bulk enrichment and assignment",
          "Import history and buying power",
          "AI recommended next action",
        ]}
      />
    </AppShell>
  ),
});
