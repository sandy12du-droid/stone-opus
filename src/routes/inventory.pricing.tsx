import { createFileRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export const Route = createFileRoute("/inventory/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Arquane OS" },
      { name: "description", content: "Price books, currencies, and margins." },
      { property: "og:title", content: "Pricing — Arquane OS" },
      { property: "og:description", content: "Price books, currencies, and margins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell title="Pricing" subtitle="Price books, currencies, tiers, and margin controls.">
      <ModulePlaceholder
        icon={Tag}
        title="Pricing engine"
        description="Multi-currency pricing with tiered discounts, freight rules, and margin visibility."
      />
    </AppShell>
  ),
});
