// Reusable cross-module entity link.
//
// Wherever an entity (customer, project, quotation, shipment, product,
// opportunity, container, order) appears in the UI, wrap the label in
// <EntityLink /> so a click:
//   1. Navigates to the correct detail route
//   2. Publishes the entity into the Global Business Context
//
// Modules never wire context by hand — they just render EntityLink.

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  useBusinessContext,
  type BusinessEntity,
  type BusinessEntityKind,
} from "@/context/BusinessContext";
import { CUSTOMERS } from "@/lib/crm-data";

type CustomerLink = {
  kind: "customer";
  /** Prefer the customer id. If unknown, pass `name` and we'll resolve it. */
  id?: string;
  name: string;
  sublabel?: string;
};
type ProjectLink = { kind: "project"; id: string; name: string; sublabel?: string };
type QuotationLink = { kind: "quotation"; id: string; name: string; sublabel?: string };
type InventoryLink = { kind: "inventory"; id: string; name: string; sublabel?: string };
type ShipmentLink = { kind: "container"; id: string; name: string; sublabel?: string };
type OpportunityLink = { kind: "order"; id: string; name: string; sublabel?: string };
type LeadLink = { kind: "lead"; id?: string; name: string; sublabel?: string };

export type EntityLinkTarget =
  | CustomerLink
  | ProjectLink
  | QuotationLink
  | InventoryLink
  | ShipmentLink
  | OpportunityLink
  | LeadLink;

interface EntityLinkProps {
  entity: EntityLinkTarget;
  children?: ReactNode;
  className?: string;
  /** Optional: subtle styling variant. */
  variant?: "default" | "plain";
}

interface Resolved {
  to: string;
  params?: Record<string, string>;
  entity: BusinessEntity;
}

function resolveCustomer(t: CustomerLink): Resolved {
  const match =
    (t.id && CUSTOMERS.find((c) => c.id === t.id)) ||
    CUSTOMERS.find((c) => c.name.toLowerCase() === t.name.toLowerCase());
  if (match) {
    const href = `/crm/customers/${match.id}`;
    return {
      to: "/crm/customers/$customerId",
      params: { customerId: match.id },
      entity: {
        kind: "customer",
        id: match.id,
        label: match.name,
        sublabel: t.sublabel ?? `${match.flag} ${match.country} · ${match.segment}`,
        href,
      },
    };
  }
  return {
    to: "/crm/customers",
    entity: {
      kind: "customer",
      id: t.name,
      label: t.name,
      sublabel: t.sublabel,
      href: "/crm/customers",
    },
  };
}

function resolve(t: EntityLinkTarget): Resolved {
  switch (t.kind) {
    case "customer":
      return resolveCustomer(t);
    case "project":
      return {
        to: "/projects/$projectId",
        params: { projectId: t.id },
        entity: { kind: "project", id: t.id, label: t.name, sublabel: t.sublabel, href: `/projects/${t.id}` },
      };
    case "quotation":
      return {
        to: "/quotations/$quotationId",
        params: { quotationId: t.id },
        entity: { kind: "quotation", id: t.id, label: t.name, sublabel: t.sublabel, href: `/quotations/${t.id}` },
      };
    case "inventory":
      return {
        to: "/inventory/products/$productId",
        params: { productId: t.id },
        entity: { kind: "inventory", id: t.id, label: t.name, sublabel: t.sublabel, href: `/inventory/products/${t.id}` },
      };
    case "container":
      return {
        to: "/shipping/$shipmentId",
        params: { shipmentId: t.id },
        entity: { kind: "container", id: t.id, label: t.name, sublabel: t.sublabel, href: `/shipping/${t.id}` },
      };
    case "order":
      return {
        to: "/sales/opportunities/$opportunityId",
        params: { opportunityId: t.id },
        entity: { kind: "order", id: t.id, label: t.name, sublabel: t.sublabel, href: `/sales/opportunities/${t.id}` },
      };
    case "lead":
      return {
        to: "/crm/leads",
        entity: { kind: "lead", id: t.id ?? t.name, label: t.name, sublabel: t.sublabel, href: "/crm/leads" },
      };
  }
}

const KIND_BASE: Record<BusinessEntityKind, string> = {
  customer: "hover:text-primary",
  lead: "hover:text-primary",
  project: "hover:text-primary",
  quotation: "hover:text-primary",
  inventory: "hover:text-primary",
  container: "hover:text-primary",
  order: "hover:text-primary",
};

export function EntityLink({ entity, children, className, variant = "default" }: EntityLinkProps) {
  const { setEntity } = useBusinessContext();
  const { to, params, entity: resolved } = resolve(entity);

  return (
    <Link
      to={to as string}
      params={params as never}
      onClick={() => setEntity(resolved)}
      className={cn(
        "font-medium transition-colors",
        variant === "default" ? "text-foreground" : "text-inherit",
        KIND_BASE[resolved.kind],
        className,
      )}
    >
      {children ?? resolved.label}
    </Link>
  );
}

