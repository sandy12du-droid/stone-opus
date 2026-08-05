import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, LogIn, LogOut, XCircle, KeyRound, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/shared/SectionCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAuthAuditLogs } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/settings/audit-logs")({
  head: () => ({
    meta: [
      { title: "Authentication Audit Logs — Arquane OS" },
      {
        name: "description",
        content:
          "Administrator view of sign-in, sign-out, failed login, and password reset activity across the workspace.",
      },
      { property: "og:title", content: "Authentication Audit Logs — Arquane OS" },
      {
        property: "og:description",
        content: "Sign-in, sign-out, and failed login activity for your Arquane OS workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditLogsPage,
});

const EVENT_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  sign_in: { label: "Sign in", icon: LogIn, tone: "text-success" },
  sign_out: { label: "Sign out", icon: LogOut, tone: "text-muted-foreground" },
  failed_login: { label: "Failed login", icon: XCircle, tone: "text-destructive" },
  password_reset_requested: {
    label: "Reset requested",
    icon: KeyRound,
    tone: "text-warning",
  },
  password_reset_completed: {
    label: "Reset completed",
    icon: CheckCircle2,
    tone: "text-primary",
  },
};

function AuditLogsPage() {
  const [event, setEvent] = useState<string>("all");
  const [search, setSearch] = useState("");
  const fetchLogs = useServerFn(listAuthAuditLogs);

  const { data, isLoading, error } = useQuery({
    queryKey: ["auth-audit-logs", event, search],
    queryFn: () =>
      fetchLogs({
        data: {
          event: event === "all" ? undefined : event,
          search: search || undefined,
          limit: 200,
        },
      }),
    refetchInterval: 30_000,
  });

  const rows = data ?? [];

  const stats = useMemo(() => {
    const count = (e: string) => rows.filter((r) => r.event === e).length;
    return [
      { label: "Sign-ins", value: count("sign_in") },
      { label: "Failed logins", value: count("failed_login") },
      { label: "Sign-outs", value: count("sign_out") },
      { label: "Password resets", value: count("password_reset_completed") },
    ];
  }, [rows]);

  return (
    <AppShell
      title="Authentication Audit Logs"
      subtitle="Every sign-in, sign-out, failed attempt, and password reset across the workspace."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.label}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <SectionCard
          title="Activity"
          right={
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by email…"
                className="h-8 w-48 text-[13px]"
              />
              <Select value={event} onValueChange={setEvent}>
                <SelectTrigger className="h-8 w-44 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {Object.entries(EVENT_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          {error ? (
            <p className="p-4 text-[13px] text-destructive">
              Unable to load audit logs. Administrator access is required.
            </p>
          ) : isLoading ? (
            <p className="p-4 text-[13px] text-muted-foreground">Loading activity…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-[13px] text-muted-foreground">
              No authentication activity recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Event</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">IP address</th>
                    <th className="px-3 py-2 font-medium">Detail</th>
                    <th className="px-3 py-2 text-right font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const meta = EVENT_META[row.event] ?? {
                      label: row.event,
                      icon: ShieldCheck,
                      tone: "text-muted-foreground",
                    };
                    const Icon = meta.icon;
                    return (
                      <tr key={row.id} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2 font-medium">
                            <Icon className={`h-4 w-4 ${meta.tone}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.email ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-muted-foreground">
                          {row.ip_address ?? "—"}
                        </td>
                        <td className="max-w-[280px] truncate px-3 py-2.5 text-muted-foreground">
                          {row.detail ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-muted-foreground">
                          {new Date(row.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
