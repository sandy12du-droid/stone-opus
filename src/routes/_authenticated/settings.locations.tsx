import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, Plus, Warehouse, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { locationsOptions, warehouseLocation } from "@/lib/locations-queries";
import { useLocation } from "@/context/LocationContext";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings/locations")({
  head: () => ({ meta: [
    { title: "Company Locations — Arquane OS" },
    { name: "description", content: "Company locations, warehouses and operating currencies in Arquane OS." },
    { property: "og:title", content: "Company Locations — Arquane OS" },
    { property: "og:description", content: "Manage company locations, warehouses and their currencies." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsOptions()),
  component: LocationsPage,
});

function LocationsPage() {
  const { data: locations } = useSuspenseQuery(locationsOptions());
  const { location, setLocation } = useLocation();
  const { isAdmin } = useRoles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company: "", warehouse: "", code: "", city: "", country: "", currency: "KES", address: "", rate: "129" });
  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_operating_location", {
        p_company: form.company.trim(), p_warehouse: form.warehouse.trim(), p_code: form.code.trim().toUpperCase(),
        p_city: form.city.trim(), p_country: form.country.trim(), p_currency: form.currency.trim().toUpperCase(),
        p_address: form.address.trim(), p_rate: Number(form.rate),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: ["locations"] });
      await qc.invalidateQueries({ queryKey: ["inventory", "warehouses"] });
      setOpen(false);
      setLocation(warehouseLocation(row));
    },
  });
  const valid = form.company.trim() && form.warehouse.trim() && form.city.trim() && form.country.trim() && /^[A-Z0-9-]{2,30}$/.test(form.code.toUpperCase()) && /^[A-Z]{3}$/.test(form.currency.toUpperCase()) && Number(form.rate) > 0;
  return <AppShell title="Company Locations" subtitle="Companies, warehouses and operating currencies." actions={isAdmin ? <Button size="sm" onClick={() => { create.reset(); setOpen(true); }}><Plus className="mr-1.5 h-4 w-4" />New location</Button> : undefined}>
    <div className="divide-y divide-border border-y border-border">
      {locations.map(w => <div key={w.id} className="flex flex-wrap items-center gap-4 py-5">
        <Building2 className="h-5 w-5 text-primary" />
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{w.company_name ?? w.name}</h2><p className="mt-1 text-xs text-muted-foreground">{w.city} · {w.country} · {w.currency_code ?? "USD"}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Warehouse className="h-3.5 w-3.5" />{w.name} · {w.code}</p>{w.address && <p className="mt-1 text-xs text-muted-foreground">{w.address}</p>}</div>
        <Button variant="outline" size="sm" onClick={() => setLocation(warehouseLocation(w))}>{location.id === w.id && <Check className="mr-1.5 h-3.5 w-3.5" />}{location.id === w.id ? "Selected" : "Select location"}</Button>
      </div>)}
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-[560px]"><DialogHeader><DialogTitle>New company location</DialogTitle></DialogHeader>
      <form onSubmit={e => { e.preventDefault(); if (valid) create.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">{([
          ["company", "Company name"], ["warehouse", "Warehouse name"], ["code", "Warehouse code"], ["city", "City"], ["country", "Country"], ["currency", "Currency (ISO code)"], ["address", "Warehouse address"], ["rate", "Local currency per 1 USD"],
        ] as const).map(([key,label]) => <div key={key} className="grid gap-1.5"><Label htmlFor={`location-${key}`}>{label}</Label><Input id={`location-${key}`} required={key !== "address"} type={key === "rate" ? "number" : "text"} min={key === "rate" ? "0.000001" : undefined} step={key === "rate" ? "any" : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}</div>
        {create.error && <p role="alert" className="text-sm text-destructive">{create.error.message}</p>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!valid || create.isPending}>{create.isPending ? "Creating…" : "Create location"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </AppShell>;
}