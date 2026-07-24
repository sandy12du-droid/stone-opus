import { createFileRoute } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Production — Arquane OS" },
      { name: "description", content: "Production floor visibility for stone fabrication." },
      { property: "og:title", content: "Production — Arquane OS" },
      { property: "og:description", content: "Production floor visibility for stone fabrication." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Production" subtitle="Fabrication queues, work orders, and yields.">
      <ModulePlaceholder icon={Factory} title="Production board" description="Job status, machine load, and shop-drawing integration." />
    </AppShell>
  ),
});
