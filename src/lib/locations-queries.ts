import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_CURRENCY, type AppLocation } from "@/lib/location";

export const locationsOptions = () => queryOptions({
  queryKey: ["locations", "warehouses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("stone_warehouses").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export function warehouseLocation(w: { id: string; name: string; company_name: string | null; city: string; country: string; code: string; currency_code: string | null; units_per_usd: number | null }): AppLocation {
  const currency = w.currency_code ?? COUNTRY_CURRENCY[w.country] ?? "USD";
  return { id: w.id, name: w.company_name ?? w.name, sub: `${w.city} · ${w.country} · ${currency}`, currency, locale: "en-US", warehouseCode: w.code, unitsPerUsd: Number(w.units_per_usd ?? 1) };
}