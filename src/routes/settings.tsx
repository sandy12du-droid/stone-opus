import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Arquane OS" },
      { name: "description", content: "Workspace, users, permissions, and integrations." },
      { property: "og:title", content: "Settings — Arquane OS" },
      { property: "og:description", content: "Workspace, users, permissions, and integrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Settings" subtitle="Company, users, permissions, currencies, units, email, and AI settings.">
      <ModulePlaceholder
        icon={Settings}
        title="Workspace configuration"
        description="Company profile, roles, currency, units, email, and AI configuration."
        bullets={["Company", "Users & permissions", "Currencies & units", "Email & AI settings"]}
      />
    </AppShell>
  ),
});
