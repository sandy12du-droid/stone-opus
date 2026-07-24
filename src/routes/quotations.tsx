import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — Arquane OS" },
      { name: "description", content: "Modern quotation builder with PDF preview." },
      { property: "og:title", content: "Quotations — Arquane OS" },
      { property: "og:description", content: "Modern quotation builder with PDF preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell
      title="Quotations"
      subtitle="Build, approve, and export professional quotations."
      actions={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">New quotation</Button>}
    >
      <ModulePlaceholder
        icon={FileText}
        title="Quotation builder"
        description="Assemble products, discounts, freight, and taxes with real-time PDF preview and approval workflow."
      />
    </AppShell>
  ),
});
