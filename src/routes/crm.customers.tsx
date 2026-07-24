import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/crm/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Arquane OS" },
      { name: "description", content: "Customer accounts, communications, and history." },
      { property: "og:title", content: "Customers — Arquane OS" },
      { property: "og:description", content: "Customer accounts, communications, and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Customers" subtitle="Accounts, contacts, and full communication history.">
      <ModulePlaceholder
        icon={Users}
        title="Customer profiles"
        description="360° account view with notes, emails, meetings, tasks, documents, and pipeline value."
        bullets={["Pipeline · Kanban · Table view", "Communication timeline", "Documents & attachments", "Tasks & meetings"]}
      />
    </AppShell>
  ),
});
