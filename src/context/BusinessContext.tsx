/**
 * Global Business Context Engine (Step 1)
 *
 * Any module can set the "active" entity the user is working with —
 * customer, lead, project, quotation, inventory item, container, or order.
 * The rest of the app (breadcrumbs, AI Command Center, right rail, etc.)
 * reads from this store instead of prop-drilling.
 *
 * This is architecture only — no business logic, no AI, no side effects.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type BusinessEntityKind =
  | "customer"
  | "lead"
  | "project"
  | "quotation"
  | "inventory"
  | "container"
  | "order";

export interface BusinessEntity {
  kind: BusinessEntityKind;
  /** Stable id from the backing table (uuid, code, etc.) */
  id: string;
  /** Human label — e.g. "ABC Stone", "Hilton Tower", "AQ-2025-00042" */
  label: string;
  /** Optional secondary label — e.g. "Customer · United States" */
  sublabel?: string;
  /** Optional route to re-open this entity */
  href?: string;
  /** Optional arbitrary metadata AI/analytics can read later */
  meta?: Record<string, unknown>;
}

export interface BusinessContextValue {
  /** Active entities keyed by kind. One active entity per kind at a time. */
  active: Partial<Record<BusinessEntityKind, BusinessEntity>>;
  /** Recently opened entities, most recent first (max 20). */
  recent: BusinessEntity[];
  /** Set / replace the active entity for its kind. */
  setEntity: (entity: BusinessEntity) => void;
  /** Clear the active entity for a given kind (or all when omitted). */
  clearEntity: (kind?: BusinessEntityKind) => void;
  /** Convenience getter. */
  getEntity: <K extends BusinessEntityKind>(kind: K) => BusinessEntity | undefined;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

const RECENT_LIMIT = 20;

export function BusinessContextProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<
    Partial<Record<BusinessEntityKind, BusinessEntity>>
  >({});
  const [recent, setRecent] = useState<BusinessEntity[]>([]);

  const setEntity = useCallback((entity: BusinessEntity) => {
    setActive((prev) => {
      const current = prev[entity.kind];
      if (
        current &&
        current.id === entity.id &&
        current.label === entity.label &&
        current.sublabel === entity.sublabel &&
        current.href === entity.href
      ) {
        return prev;
      }
      return { ...prev, [entity.kind]: entity };
    });
    setRecent((prev) => {
      const filtered = prev.filter(
        (e) => !(e.kind === entity.kind && e.id === entity.id),
      );
      return [entity, ...filtered].slice(0, RECENT_LIMIT);
    });
  }, []);

  const clearEntity = useCallback((kind?: BusinessEntityKind) => {
    setActive((prev) => {
      if (!kind) return {};
      if (!prev[kind]) return prev;
      const next = { ...prev };
      delete next[kind];
      return next;
    });
  }, []);

  const getEntity = useCallback(
    <K extends BusinessEntityKind>(kind: K) => active[kind],
    [active],
  );

  const value = useMemo<BusinessContextValue>(
    () => ({ active, recent, setEntity, clearEntity, getEntity }),
    [active, recent, setEntity, clearEntity, getEntity],
  );

  return (
    <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
  );
}

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error(
      "useBusinessContext must be used inside <BusinessContextProvider />",
    );
  }
  return ctx;
}

/**
 * Set the active entity for the current page. Deep-compares by JSON so callers
 * can inline the object literal without triggering render loops.
 */
export function useSetBusinessContext(
  entity: BusinessEntity | null | undefined,
) {
  const { setEntity, clearEntity } = useBusinessContext();
  const serialized = entity ? JSON.stringify(entity) : null;
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (serialized === lastRef.current) return;
    lastRef.current = serialized;
    if (entity) setEntity(entity);
    // Intentionally not clearing on unmount — the entity should stay active as
    // the user navigates elsewhere so cross-module features can still read it.
    // Consumers can call clearEntity() explicitly if needed.
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return { clearEntity };
}
