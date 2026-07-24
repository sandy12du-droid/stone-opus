import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Arquane OS" },
      { name: "description", content: "Executive dashboard for stone business operations." },
      { property: "og:title", content: "Dashboard — Arquane OS" },
      { property: "og:description", content: "Executive dashboard for stone business operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Executive overview of sales, inventory, production, and shipping."
      actions={
        <>
          <Button variant="outline" size="sm">Last 30 days</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Export report
          </Button>
        </>
      }
    >
      <ModulePlaceholder
        icon={LayoutDashboard}
        title="Executive KPIs coming next"
        description="This dashboard will surface pipeline revenue, open quotations, inventory alerts, container status, and AI recommendations. Build queued for the next module pass."
        bullets={[
          "Today's Leads · Open Quotations · Inventory Alerts",
          "Production Status · Containers Ready · Revenue Pipeline",
          "Tasks Due · Customer Follow-ups · Recent Activity",
          "AI Recommendations · Quick Actions",
        ]}
      />
    </AppShell>
  );
}
