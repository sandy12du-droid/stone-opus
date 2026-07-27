/**
 * Step 7 — Notification Center panel.
 *
 * Renders grouped, filterable notifications. Used inside the right-rail
 * "Alerts" tab and the TopBar bell popover.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Check, CheckCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import {
  CATEGORY_META,
  type NotificationCategory,
  type NotificationTone,
} from "@/lib/notifications-data";
import { useBusinessContext } from "@/context/BusinessContext";

const FILTERS: { id: "all" | "unread" | NotificationCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "approvals", label: "Approvals" },
  { id: "inventory", label: "Inventory" },
  { id: "shipping", label: "Shipping" },
  { id: "followups", label: "Follow-ups" },
  { id: "ai", label: "AI" },
];

const TONE_DOT: Record<NotificationTone, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export function NotificationsPanel({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const { items, unreadCount, markRead, markAllRead, dismiss } =
    useNotifications();
  const { setEntity } = useBusinessContext();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const g: Partial<Record<NotificationCategory, typeof filtered>> = {};
    for (const n of filtered) (g[n.category] ||= []).push(n);
    return g;
  }, [filtered]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-[11px] text-muted-foreground">
          {unreadCount === 0 ? (
            "You're all caught up"
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {unreadCount}
              </span>{" "}
              unread
            </>
          )}
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-40"
        >
          <CheckCheck className="h-3 w-3" /> Mark all read
        </button>
      </div>

      <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                active
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-2 h-9 w-9 rounded-full bg-surface-muted" />
            <div className="text-[12.5px] font-medium text-foreground">
              Nothing here
            </div>
            <div className="mt-1 max-w-[220px] text-[11px] text-muted-foreground">
              You've cleared this bucket. New alerts will appear as they happen.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(Object.keys(grouped) as NotificationCategory[]).map((cat) => {
              const list = grouped[cat] ?? [];
              const meta = CATEGORY_META[cat];
              return (
                <div key={cat}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {meta.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {list.length}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {list.map((n) => {
                      const handleOpen = () => {
                        markRead(n.id);
                        if (n.entity) {
                          setEntity(n.entity);
                          if (n.entity.href) {
                            navigate({ to: n.entity.href });
                          }
                        }
                        onNavigate?.();
                      };
                      return (
                        <li
                          key={n.id}
                          className={cn(
                            "group relative rounded-md border px-2.5 py-2 transition-colors",
                            n.read
                              ? "border-border bg-surface"
                              : "border-border-strong bg-surface-muted/60",
                          )}
                        >
                          <button
                            onClick={handleOpen}
                            className="block w-full pr-10 text-left"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={cn(
                                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                                  TONE_DOT[n.tone],
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "truncate text-[12.5px] leading-snug",
                                    n.read
                                      ? "font-medium text-foreground/85"
                                      : "font-semibold text-foreground",
                                  )}
                                >
                                  {n.title}
                                </div>
                                {n.body && !compact && (
                                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                                    {n.body}
                                  </div>
                                )}
                                <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
                                  <span>{n.time}</span>
                                  {n.entity && (
                                    <span className="inline-flex items-center gap-0.5 text-primary">
                                      Open <ArrowUpRight className="h-2.5 w-2.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {!n.read && (
                              <button
                                onClick={() => markRead(n.id)}
                                aria-label="Mark as read"
                                className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => dismiss(n.id)}
                              aria-label="Dismiss"
                              className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {compact && (
        <div className="mt-3 border-t border-border pt-2 text-center">
          <Link
            to="/workspace"
            onClick={onNavigate}
            className="text-[11.5px] font-medium text-primary hover:underline"
          >
            View in workspace →
          </Link>
        </div>
      )}
    </div>
  );
}
