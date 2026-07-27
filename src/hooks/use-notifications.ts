/**
 * Notification store — reads the mock feed and layers per-session read state
 * on top. Persists dismissed/read ids in localStorage so the badge count is
 * stable across reloads.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notifications as seed,
  type AppNotification,
  type NotificationCategory,
} from "@/lib/notifications-data";

const READ_KEY = "arquane:notifications:read";
const DISMISSED_KEY = "arquane:notifications:dismissed";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

export interface UseNotifications {
  items: (AppNotification & { read: boolean })[];
  unreadCount: number;
  byCategory: Partial<
    Record<NotificationCategory, (AppNotification & { read: boolean })[]>
  >;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export function useNotifications(): UseNotifications {
  const [readIds, setReadIds] = useState<Set<string>>(() => readSet(READ_KEY));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() =>
    readSet(DISMISSED_KEY),
  );

  useEffect(() => writeSet(READ_KEY, readIds), [readIds]);
  useEffect(() => writeSet(DISMISSED_KEY, dismissedIds), [dismissedIds]);

  const items = useMemo(
    () =>
      seed
        .filter((n) => !dismissedIds.has(n.id))
        .map((n) => ({ ...n, read: readIds.has(n.id) }))
        .sort((a, b) => (a.ts < b.ts ? 1 : -1)),
    [readIds, dismissedIds],
  );

  const unreadCount = items.filter((n) => !n.read).length;

  const byCategory = useMemo(() => {
    const g: Partial<
      Record<NotificationCategory, (AppNotification & { read: boolean })[]>
    > = {};
    for (const n of items) (g[n.category] ||= []).push(n);
    return g;
  }, [items]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(seed.map((n) => n.id)));
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return { items, unreadCount, byCategory, markRead, markAllRead, dismiss };
}
