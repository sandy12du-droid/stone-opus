// Shared CRM mock data. Kept in one place so the customer list, workspace,
// and command palette all draw from the same source. Swap for Supabase later.

export type Tier = "Platinum" | "Gold" | "Silver" | "Emerging";
export type Health = "Healthy" | "At risk" | "Churning";

export interface Customer {
  id: string;
  name: string;
  country: string;
  flag: string;
  segment: string;
  tier: Tier;
  ltv: number;
  ytd: number;
  yoy: number;
  orders: number;
  lastOrder: string;
  health: Health;
  owner: string;
  ownerInitials: string;
  favorite: string;
  email?: string;
  phone?: string;
  city?: string;
  since?: string;
}

export const CUSTOMERS: Customer[] = [
  { id: "C-1042", name: "Vittoria Stone Group", country: "Italy", flag: "🇮🇹", segment: "Distributor", tier: "Platinum", ltv: 4820000, ytd: 682000, yoy: 14.2, orders: 128, lastOrder: "3d ago", health: "Healthy", owner: "Sofia Marin", ownerInitials: "SM", favorite: "Calacatta Viola", email: "orders@vittoriastone.it", phone: "+39 055 214 8890", city: "Carrara", since: "2018" },
  { id: "C-1039", name: "Al Habtoor Marble LLC", country: "UAE", flag: "🇦🇪", segment: "Fabricator", tier: "Platinum", ltv: 3150000, ytd: 495000, yoy: 22.6, orders: 96, lastOrder: "1w ago", health: "Healthy", owner: "Priya Nair", ownerInitials: "PN", favorite: "Statuario Extra", email: "procure@habtoormarble.ae", phone: "+971 4 338 2200", city: "Dubai", since: "2019" },
  { id: "C-1036", name: "Granite World USA", country: "USA", flag: "🇺🇸", segment: "Retail chain", tier: "Gold", ltv: 2410000, ytd: 318000, yoy: -4.1, orders: 74, lastOrder: "2w ago", health: "At risk", owner: "David Ono", ownerInitials: "DO", favorite: "Absolute Black", email: "buying@graniteworld.us", phone: "+1 214 555 7788", city: "Dallas", since: "2017" },
  { id: "C-1032", name: "Marmoles de Sonora", country: "Mexico", flag: "🇲🇽", segment: "Distributor", tier: "Gold", ltv: 1920000, ytd: 240000, yoy: 8.7, orders: 61, lastOrder: "4d ago", health: "Healthy", owner: "Sofia Marin", ownerInitials: "SM", favorite: "Travertino Romano", email: "ventas@marmolesdesonora.mx", phone: "+52 662 210 9944", city: "Hermosillo", since: "2020" },
  { id: "C-1028", name: "Osaka Ishi Trading", country: "Japan", flag: "🇯🇵", segment: "Distributor", tier: "Gold", ltv: 1740000, ytd: 205000, yoy: 3.4, orders: 52, lastOrder: "6d ago", health: "Healthy", owner: "David Ono", ownerInitials: "DO", favorite: "Quartz Bianco", email: "trade@osaka-ishi.jp", phone: "+81 6 6210 4488", city: "Osaka", since: "2019" },
  { id: "C-1024", name: "Berlin Stein Werk", country: "Germany", flag: "🇩🇪", segment: "Fabricator", tier: "Silver", ltv: 985000, ytd: 128000, yoy: -12.8, orders: 38, lastOrder: "5w ago", health: "Churning", owner: "Priya Nair", ownerInitials: "PN", favorite: "Nero Marquina", email: "einkauf@berlinstein.de", phone: "+49 30 219 88 220", city: "Berlin", since: "2021" },
  { id: "C-1019", name: "Cape Stone Co.", country: "South Africa", flag: "🇿🇦", segment: "Distributor", tier: "Silver", ltv: 720000, ytd: 96000, yoy: 18.3, orders: 29, lastOrder: "2d ago", health: "Healthy", owner: "Sofia Marin", ownerInitials: "SM", favorite: "Verde Guatemala", email: "hello@capestone.co.za", phone: "+27 21 447 5510", city: "Cape Town", since: "2022" },
  { id: "C-1015", name: "Lima Marmol S.A.C.", country: "Peru", flag: "🇵🇪", segment: "Fabricator", tier: "Emerging", ltv: 310000, ytd: 84000, yoy: 42.1, orders: 14, lastOrder: "9d ago", health: "Healthy", owner: "David Ono", ownerInitials: "DO", favorite: "Onyx Miele", email: "ventas@limamarmol.pe", phone: "+51 1 421 7788", city: "Lima", since: "2023" },
];

export const TIER_STYLES: Record<Tier, string> = {
  Platinum: "bg-primary/10 text-primary border-primary/25",
  Gold: "bg-accent/15 text-accent-foreground border-accent/30",
  Silver: "bg-muted text-muted-foreground border-border",
  Emerging: "bg-info/10 text-info border-info/20",
};

export const HEALTH_STYLES: Record<Health, string> = {
  Healthy: "bg-success/10 text-success border-success/20",
  "At risk": "bg-warning/10 text-warning border-warning/20",
  Churning: "bg-destructive/10 text-destructive border-destructive/20",
};

export const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const getCustomer = (id: string) => CUSTOMERS.find((c) => c.id === id);
