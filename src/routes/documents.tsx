import { createFileRoute } from "@tanstack/react-router";
import { Files } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Arquane OS" },
      { name: "description", content: "Document center for quotations, invoices, PIs, and certificates." },
      { property: "og:title", content: "Documents — Arquane OS" },
      { property: "og:description", content: "Document center for quotations, invoices, PIs, and certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Documents" subtitle="Single source of truth for commercial and technical documents.">
      <ModulePlaceholder
        icon={Files}
        title="Document center"
        description="Quotations, invoices, proforma, packing lists, warranties, certificates, TDS, catalogs, and drawings."
      />
    </AppShell>
  ),
});
