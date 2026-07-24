import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Arquane OS" },
      { name: "description", content: "Executive analytics across sales, inventory, and customers." },
      { property: "og:title", content: "Reports — Arquane OS" },
      { property: "og:description", content: "Executive analytics across sales, inventory, and customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Reports" subtitle="Executive analytics: sales, revenue, inventory, and performance.">
      <ModulePlaceholder icon={BarChart3} title="Analytics workspace" description="KPI grids and charts across all modules." />
    </AppShell>
  ),
});
