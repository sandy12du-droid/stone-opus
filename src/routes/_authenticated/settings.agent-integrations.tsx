import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, BookOpen, Unplug } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/shared/SectionCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/agent-integrations")({
  head: () => ({
    meta: [
      { title: "Agent Integrations — Arquane OS" },
      { name: "description", content: "Manage and revoke AI agents connected to your Arquane OS account." },
      { property: "og:title", content: "Agent Integrations — Arquane OS" },
      { property: "og:description", content: "Connected AI assistants, consents and sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentIntegrationsPage,
});

function fmt(ts?: string | null) {
  return ts ? new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "—";
}

function AgentIntegrationsPage() {
  const qc = useQueryClient();
  const grants = useQuery({
    queryKey: ["oauth-grants"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.oauth.listGrants();
      if (error) throw error;
      return data ?? [];
    },
  });
  const sessions = useQuery({
    queryKey: ["my-mcp-sessions"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("mcp_usage_logs")
        .select("client_id, created_at, tool_name")
        .eq("user_id", u.user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const map = new Map<string, { last: string; calls: number; lastTool: string }>();
      for (const r of data ?? []) {
        const k = r.client_id ?? "unknown";
        const cur = map.get(k);
        if (cur) cur.calls++;
        else map.set(k, { last: r.created_at, calls: 1, lastTool: r.tool_name });
      }
      return map;
    },
  });
  const revoke = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access revoked. The agent's sessions have been signed out.");
      qc.invalidateQueries({ queryKey: ["oauth-grants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = grants.data ?? [];

  return (
    <AppShell title="Agent Integrations" subtitle="AI assistants you've allowed to act on your behalf.">
      <div className="space-y-5">
        <SectionCard
          title="Connected agents"
          icon={Bot}
          right={
            <Link to="/docs/mcp" className="flex items-center gap-1 text-[12px] text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Developer docs
            </Link>
          }
        >
          {grants.error ? (
            <p className="text-[13px] text-destructive">Could not load connected agents.</p>
          ) : grants.isLoading ? (
            <p className="text-[13px] text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No agents connected yet. Add this app's MCP address to an AI assistant to connect.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {list.map((g) => {
                const s = sessions.data?.get(g.client.id);
                return (
                  <div key={g.client.id} className="flex items-center gap-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{g.client.name || g.client.id}</div>
                      <div className="text-[12px] text-muted-foreground">
                        Approved {fmt(g.granted_at)} · {s ? `${s.calls} calls, last ${fmt(s.last)} (${s.lastTool})` : "No calls yet"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revoke.isPending}
                      onClick={() => {
                        if (confirm(`Revoke access for ${g.client.name || "this agent"}?`)) revoke.mutate(g.client.id);
                      }}
                    >
                      <Unplug className="mr-1.5 h-3.5 w-3.5" /> Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
