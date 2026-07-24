import { createFileRoute } from "@tanstack/react-router";
import { Ship } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping — Arquane OS" },
      { name: "description", content: "Container loading, freight, and delivery tracking." },
      { property: "og:title", content: "Shipping — Arquane OS" },
      { property: "og:description", content: "Container loading, freight, and delivery tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Shipping" subtitle="Container planning, freight, and delivery tracking.">
      <ModulePlaceholder icon={Ship} title="Shipping operations" description="Container loading, bill of lading, and ETA tracking." />
    </AppShell>
  ),
});
