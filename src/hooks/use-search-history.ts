// Persist recent + pinned search results in localStorage so ⌘K remembers
// the operator's context across reloads.
import { useCallback, useEffect, useState } from "react";
import type { SearchResult } from "@/lib/search-providers";

const RECENT_KEY = "arquane:search:recent";
const PINNED_KEY = "arquane:search:pinned";
const RECENT_LIMIT = 8;

// We persist only the serializable subset; icon/component is re-hydrated from
// the provider at query time. If a stored key no longer resolves, we keep the
// stub so the user can still see history — it just won't render an icon.
export type StoredResult = Omit<SearchResult, "icon"> & { iconName?: string };

function readStore(key: string): StoredResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StoredResult[]) : [];
  } catch {
    return [];
  }
}

function writeStore(key: string, value: StoredResult[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

const strip = (r: SearchResult): StoredResult => {
  const { icon: _icon, ...rest } = r;
  return rest;
};

export function useSearchHistory() {
  const [recent, setRecent] = useState<StoredResult[]>([]);
  const [pinned, setPinned] = useState<StoredResult[]>([]);

  useEffect(() => {
    setRecent(readStore(RECENT_KEY));
    setPinned(readStore(PINNED_KEY));
  }, []);

  const recordUse = useCallback((r: SearchResult) => {
    setRecent((prev) => {
      const next = [strip(r), ...prev.filter((p) => p.key !== r.key)].slice(0, RECENT_LIMIT);
      writeStore(RECENT_KEY, next);
      return next;
    });
  }, []);

  const togglePin = useCallback((r: SearchResult) => {
    setPinned((prev) => {
      const exists = prev.some((p) => p.key === r.key);
      const next = exists ? prev.filter((p) => p.key !== r.key) : [strip(r), ...prev];
      writeStore(PINNED_KEY, next);
      return next;
    });
  }, []);

  const isPinned = useCallback(
    (key: string) => pinned.some((p) => p.key === key),
    [pinned],
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
    writeStore(RECENT_KEY, []);
  }, []);

  return { recent, pinned, recordUse, togglePin, isPinned, clearRecent };
}
