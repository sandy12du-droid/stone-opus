// Active business location (country + currency). Module-level so plain
// formatting helpers can convert amounts without React context.
export type AppLocation = {
  id: string;
  name: string;
  sub: string;
  currency: string; // ISO code
  locale: string;
  warehouseCode: string | null; // null = all warehouses
};

export const HQ_LOCATION: AppLocation = {
  id: "hq-us",
  name: "Arquane Surfaces",
  sub: "HQ · United States",
  currency: "USD",
  locale: "en-US",
  warehouseCode: null,
};

// Units of local currency per 1 USD (fixed reference rates).
export const USD_RATES: Record<string, number> = { USD: 1, KES: 129, INR: 83 };
const LOCALES: Record<string, string> = { USD: "en-US", KES: "en-KE", INR: "en-IN" };
export const COUNTRY_CURRENCY: Record<string, string> = { Kenya: "KES", India: "INR" };

let active: AppLocation = HQ_LOCATION;
export const setActiveLocation = (l: AppLocation) => { active = l; };
export const getActiveLocation = () => active;

/** Format an amount stored in `from` currency into the active location's currency. */
export function formatMoney(n: number, from = "USD", compact = false): string {
  const to = active.currency;
  let value = n;
  let ccy = from;
  if (from !== to && USD_RATES[from] && USD_RATES[to]) {
    value = (n / USD_RATES[from]) * USD_RATES[to];
    ccy = to;
  }
  const formatted = new Intl.NumberFormat(LOCALES[ccy] ?? "en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 0,
    ...(compact ? { notation: "compact" as const, maximumFractionDigits: 2 } : {}),
  }).format(value);
  return ccy === "KES" ? formatted.replace(/Ksh/gi, "KSh") : formatted;
}
