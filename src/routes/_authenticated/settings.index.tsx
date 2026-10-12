import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, BookOpen, Activity, ShieldCheck, ChevronRight, Building2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/shared/SectionCard";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/_authenticated/settings/")({
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
  component: SettingsPage,
});

function SettingsPage() {
  const { isAdmin } = useRoles();
  const items = [
    { to: "/settings/locations", icon: Building2, title: "Company Locations", desc: "Companies, warehouses and local currencies." },
    { to: "/settings/agent-integrations", icon: Bot, title: "Agent Integrations", desc: "Connected AI assistants, consents and sessions." },
    { to: "/docs/mcp", icon: BookOpen, title: "MCP Developer Docs", desc: "OAuth flow, tools and example calls." },
    ...(isAdmin
      ? [
          { to: "/settings/mcp-logs", icon: Activity, title: "MCP Usage Logs", desc: "Every agent tool call across the workspace." },
          { to: "/settings/audit-logs", icon: ShieldCheck, title: "Authentication Audit Logs", desc: "Sign-ins, sign-outs and failures." },
        ]
      : []),
  ] as const;
  return (
    <AppShell title="Settings" subtitle="Company, users, permissions, integrations and AI settings.">
      <SectionCard title="Workspace">
        <div className="divide-y divide-border">
          {items.map((i) => (
            <Link key={i.to} to={i.to} className="flex items-center gap-3 py-3 hover:text-primary">
              <i.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{i.title}</div>
                <div className="text-[12px] text-muted-foreground">{i.desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
