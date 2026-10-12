import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Boxes, FileText, FolderKanban, Ship } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { quotationsListOptions } from "@/lib/quotations-queries";
import { projectsListOptions } from "@/lib/projects-queries";
import { shipmentsListOptions } from "@/lib/shipping-queries";
import { productsWithStockOptions, aggregateProduct } from "@/lib/inventory-queries";
import { formatMoney } from "@/lib/location";

export function LocationOverview({ title }: { title: string }) {
  const { location } = useLocation();
  const { data: quotations } = useSuspenseQuery(quotationsListOptions());
  const { data: projects } = useSuspenseQuery(projectsListOptions());
  const { data: shipments } = useSuspenseQuery(shipmentsListOptions());
  const { data: products } = useSuspenseQuery(productsWithStockOptions());
  const open = quotations.filter(q => ["draft", "in_review", "sent"].includes(q.status));
  const value = open.reduce((s,q) => s + Number(q.total), 0);
  const counts = [
    { label: "Open quotations", value: open.length, icon: FileText, to: "/quotations" },
    { label: "Projects", value: projects.length, icon: FolderKanban, to: "/projects" },
    { label: "Shipments", value: shipments.length, icon: Ship, to: "/shipping" },
    { label: "Available slabs", value: products.reduce((s,p) => s + aggregateProduct(p).available, 0), icon: Boxes, to: "/inventory/products" },
  ] as const;
  return <section>
    <p className="text-xs text-muted-foreground">{location.name} · {location.currency}</p>
    <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{counts.map(c => <Link key={c.label} to={c.to} className="rounded-lg border border-border bg-surface p-4"><div className="flex items-center justify-between text-xs text-muted-foreground">{c.label}<c.icon className="h-4 w-4" /></div><div className="mt-3 text-2xl font-semibold">{c.value}</div></Link>)}</div>
    <div className="mt-6 border-y border-border py-5"><p className="text-xs text-muted-foreground">Quotation pipeline</p><p className="mt-2 text-2xl font-semibold">{formatMoney(value, location.currency, true)}</p></div>
    <div className="mt-6"><h2 className="text-sm font-semibold">Recent quotations</h2>{quotations.length === 0 ? <p className="py-8 text-sm text-muted-foreground">No quotations yet.</p> : <div className="mt-3 divide-y divide-border">{quotations.slice(0,5).map(q => <Link key={q.id} to="/quotations/$quotationId" params={{ quotationId: q.id }} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{q.number} · {q.customer_name}</span><span>{formatMoney(Number(q.total), q.currency)}</span></Link>)}</div>}</div>
  </section>;
}