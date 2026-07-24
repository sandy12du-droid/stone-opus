import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/inventory/products")({
  head: () => ({
    meta: [
      { title: "Inventory — Arquane OS" },
      { name: "description", content: "Slab-level inventory across warehouses." },
      { property: "og:title", content: "Inventory — Arquane OS" },
      { property: "og:description", content: "Slab-level inventory across warehouses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell
      title="Inventory"
      subtitle="Slab-level stock across warehouses with high-resolution imagery."
      actions={<Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Add inventory</Button>}
    >
      <ModulePlaceholder
        icon={Package}
        title="Slab library"
        description="Grid and list views with zoomable slab imagery, thickness, finish, color, warehouse, and reservation status."
        bullets={["Grid & list views", "Zoomable previews", "Availability & reservations", "Advanced filters"]}
      />
    </AppShell>
  ),
});
