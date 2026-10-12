import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/shared/SectionCard";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/mcp-logs")({
  head: () => ({
    meta: [
      { title: "MCP Usage Logs — Arquane OS" },
      { name: "description", content: "Administrator log of every agent tool call: tool, user, latency, IP and outcome." },
      { property: "og:title", content: "MCP Usage Logs — Arquane OS" },
      { property: "og:description", content: "Every AI agent tool call across your Arquane OS workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: McpLogsPage,
});

function McpLogsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["mcp-usage-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcp_usage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
    refetchInterval: 15_000,
  });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (r) => !q || r.tool_name.includes(q) || (r.user_email ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);
  const stats = useMemo(() => {
    const all = data ?? [];
    const errors = all.filter((r) => r.outcome === "error").length;
    const avg = all.length ? Math.round(all.reduce((s, r) => s + r.latency_ms, 0) / all.length) : 0;
    return [
      { label: "Calls", value: all.length },
      { label: "Errors", value: errors },
      { label: "Avg latency", value: `${avg} ms` },
      { label: "Users", value: new Set(all.map((r) => r.user_id)).size },
    ];
  }, [data]);

  return (
    <AppShell title="MCP Usage Logs" subtitle="Every tool call made by connected AI agents.">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{s.value}</div>
            </div>
          ))}
        </div>
        <SectionCard
          title="Tool calls"
          right={
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by tool or email…"
              className="h-8 w-56 text-[13px]"
            />
          }
        >
          {error ? (
            <p className="p-4 text-[13px] text-destructive">Unable to load logs.</p>
          ) : isLoading ? (
            <p className="p-4 text-[13px] text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-[13px] text-muted-foreground">No agent tool calls recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Outcome</th>
                    <th className="px-3 py-2 font-medium">Tool</th>
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Client</th>
                    <th className="px-3 py-2 font-medium">IP</th>
                    <th className="px-3 py-2 text-right font-medium">Latency</th>
                    <th className="px-3 py-2 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0" title={r.error_message ?? undefined}>
                      <td className="px-3 py-2.5">
                        {r.outcome === "success" ? (
                          <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="h-4 w-4" />Success</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-destructive"><XCircle className="h-4 w-4" />Error</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px]">{r.tool_name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.user_email ?? "—"}</td>
                      <td className="max-w-[140px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{r.client_id ?? "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-muted-foreground">{r.ip_address ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.latency_ms} ms</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground">
                        {new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
