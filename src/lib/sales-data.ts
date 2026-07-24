// Shared sales workflow domain model.
// Mock data now — designed so each entity can be swapped 1:1 with a Supabase
// table (opportunities, contacts, activities, tasks) without changing the UI.

export const SALES_STAGES = [
  "New Lead",
  "Qualified",
  "Contacted",
  "Meeting Scheduled",
  "Quotation Sent",
  "Negotiation",
  "Order Confirmed",
  "Production",
  "Shipping",
  "Completed",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];

export const STAGE_PROBABILITY: Record<SalesStage, number> = {
  "New Lead": 5,
  Qualified: 15,
  Contacted: 25,
  "Meeting Scheduled": 40,
  "Quotation Sent": 55,
  Negotiation: 70,
  "Order Confirmed": 90,
  Production: 95,
  Shipping: 98,
  Completed: 100,
};

export const STAGE_TONE: Record<SalesStage, string> = {
  "New Lead": "bg-slate-100 text-slate-700 border-slate-200",
  Qualified: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Meeting Scheduled": "bg-violet-50 text-violet-700 border-violet-200",
  "Quotation Sent": "bg-amber-50 text-amber-700 border-amber-200",
  Negotiation: "bg-orange-50 text-orange-700 border-orange-200",
  "Order Confirmed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Production: "bg-teal-50 text-teal-700 border-teal-200",
  Shipping: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Completed: "bg-primary/10 text-primary border-primary/20",
};

export type Contact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  primary?: boolean;
};

export type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "quote" | "stage" | "task";
  title: string;
  detail?: string;
  actor: string;
  at: string; // display string
};

export type FollowUp = {
  id: string;
  title: string;
  due: string;
  owner: string;
  status: "upcoming" | "overdue" | "done";
};

export type Opportunity = {
  id: string;
  name: string;
  customer: string;
  country: string;
  flag: string;
  industry: string;
  stage: SalesStage;
  value: number;
  currency: string;
  probability: number;
  expectedClose: string;
  owner: { name: string; initials: string };
  source: string;
  createdAt: string;
  lastActivity: string;
  nextStep: string;
  quotationRef?: string;
  orderRef?: string;
  projectRef?: string;
  contacts: Contact[];
  tags: string[];
  aiSignal?: { tone: "positive" | "warning" | "info"; text: string };
};

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "OPP-2041",
    name: "Marina Bay Residences — Lobby & Cladding",
    customer: "Meridian Contracts Pte",
    country: "Singapore",
    flag: "🇸🇬",
    industry: "Luxury Residential",
    stage: "Negotiation",
    value: 428_000,
    currency: "USD",
    probability: STAGE_PROBABILITY.Negotiation,
    expectedClose: "Dec 12, 2026",
    owner: { name: "Priya Ravi", initials: "PR" },
    source: "Referral · Aecom",
    createdAt: "Sep 04, 2026",
    lastActivity: "2h ago",
    nextStep: "Revise pricing on Calacatta Oro floor pattern",
    quotationRef: "QT-2026-0184",
    contacts: [
      { name: "Wei Lin Tan", role: "Procurement Director", email: "wl.tan@meridian.sg", phone: "+65 6123 4488", primary: true },
      { name: "Rashid Ahmed", role: "Project Architect", email: "rashid@meridian.sg", phone: "+65 6123 4491" },
    ],
    tags: ["Marble", "CIF Singapore", "Tier 1"],
    aiSignal: { tone: "positive", text: "High close probability — respond within 24h to lock in Q4 pricing." },
  },
  {
    id: "OPP-2042",
    name: "Newark HQ Retrofit — Vanity Tops",
    customer: "Northline Interiors LLC",
    country: "United States",
    flag: "🇺🇸",
    industry: "Commercial Fit-Out",
    stage: "Quotation Sent",
    value: 186_500,
    currency: "USD",
    probability: STAGE_PROBABILITY["Quotation Sent"],
    expectedClose: "Nov 28, 2026",
    owner: { name: "Marcus Ford", initials: "MF" },
    source: "Inbound web",
    createdAt: "Oct 01, 2026",
    lastActivity: "Yesterday",
    nextStep: "Follow up on quotation QT-2026-0182",
    quotationRef: "QT-2026-0182",
    contacts: [
      { name: "Elena Ruiz", role: "Purchasing Lead", email: "e.ruiz@northline.com", phone: "+1 973 555 0142", primary: true },
    ],
    tags: ["Quartz", "FOB Newark"],
    aiSignal: { tone: "warning", text: "Quote opened 3 times — no reply in 5 days. Suggest phone follow-up." },
  },
  {
    id: "OPP-2043",
    name: "Doha Skyline Tower — Cladding Package",
    customer: "Qatar Stone Group",
    country: "Qatar",
    flag: "🇶🇦",
    industry: "Hospitality",
    stage: "Meeting Scheduled",
    value: 912_000,
    currency: "USD",
    probability: STAGE_PROBABILITY["Meeting Scheduled"],
    expectedClose: "Feb 20, 2027",
    owner: { name: "Priya Ravi", initials: "PR" },
    source: "Trade show — Marmomac",
    createdAt: "Oct 12, 2026",
    lastActivity: "4h ago",
    nextStep: "Site visit Dec 03 — bring 3 slab samples",
    contacts: [
      { name: "Khalid Al-Marri", role: "Managing Director", email: "khalid@qsg.qa", phone: "+974 4412 9900", primary: true },
      { name: "Sofia Marchetti", role: "Design Consultant", email: "sofia@qsg.qa", phone: "+974 4412 9911" },
    ],
    tags: ["Marble", "Limestone", "Tier 1"],
    aiSignal: { tone: "info", text: "Client viewed Calacatta Statuario library twice this week." },
  },
  {
    id: "OPP-2044",
    name: "Chennai Villa Collection — Phase 2",
    customer: "Ashra Developers",
    country: "India",
    flag: "🇮🇳",
    industry: "Luxury Residential",
    stage: "Order Confirmed",
    value: 275_400,
    currency: "USD",
    probability: STAGE_PROBABILITY["Order Confirmed"],
    expectedClose: "Nov 15, 2026",
    owner: { name: "Arjun Mehta", initials: "AM" },
    source: "Existing account",
    createdAt: "Aug 20, 2026",
    lastActivity: "1d ago",
    nextStep: "Confirm container booking with Maersk",
    quotationRef: "QT-2026-0176",
    orderRef: "SO-2026-0091",
    contacts: [
      { name: "Nisha Iyer", role: "Head of Procurement", email: "nisha@ashra.in", phone: "+91 44 4210 3300", primary: true },
    ],
    tags: ["Granite", "CIF Chennai"],
  },
  {
    id: "OPP-2045",
    name: "Milan Boutique Rollout",
    customer: "Studio Perla",
    country: "Italy",
    flag: "🇮🇹",
    industry: "Retail",
    stage: "Contacted",
    value: 64_000,
    currency: "EUR",
    probability: STAGE_PROBABILITY.Contacted,
    expectedClose: "Jan 30, 2027",
    owner: { name: "Isabella Conti", initials: "IC" },
    source: "LinkedIn outbound",
    createdAt: "Oct 18, 2026",
    lastActivity: "3d ago",
    nextStep: "Send capabilities deck + quartz catalogue",
    contacts: [
      { name: "Giulia Perla", role: "Founder", email: "giulia@studioperla.it", phone: "+39 02 7788 1122", primary: true },
    ],
    tags: ["Quartz", "EXW Livorno"],
  },
  {
    id: "OPP-2046",
    name: "Berlin Airport Concourse B",
    customer: "Konig Bau AG",
    country: "Germany",
    flag: "🇩🇪",
    industry: "Public Infrastructure",
    stage: "Qualified",
    value: 1_240_000,
    currency: "EUR",
    probability: STAGE_PROBABILITY.Qualified,
    expectedClose: "May 15, 2027",
    owner: { name: "Marcus Ford", initials: "MF" },
    source: "Public tender",
    createdAt: "Oct 22, 2026",
    lastActivity: "5d ago",
    nextStep: "Submit prequalification documents by Nov 10",
    contacts: [
      { name: "Dr. Anna Weber", role: "Tender Lead", email: "a.weber@konigbau.de", phone: "+49 30 5544 8877", primary: true },
    ],
    tags: ["Granite", "Public Tender", "Tier 1"],
    aiSignal: { tone: "info", text: "Similar tenders historically close in 6 months. Plan sample logistics now." },
  },
  {
    id: "OPP-2047",
    name: "Dubai Marina Penthouse",
    customer: "Al Faraj Design House",
    country: "UAE",
    flag: "🇦🇪",
    industry: "Luxury Residential",
    stage: "New Lead",
    value: 58_000,
    currency: "USD",
    probability: STAGE_PROBABILITY["New Lead"],
    expectedClose: "Feb 05, 2027",
    owner: { name: "Priya Ravi", initials: "PR" },
    source: "Website form",
    createdAt: "Nov 05, 2026",
    lastActivity: "6h ago",
    nextStep: "Initial qualification call",
    contacts: [
      { name: "Fatima Al Faraj", role: "Interior Designer", email: "fatima@alfaraj.ae", phone: "+971 4 388 9900", primary: true },
    ],
    tags: ["Marble", "Retail"],
  },
  {
    id: "OPP-2048",
    name: "Tokyo Ginza Flagship",
    customer: "Kishimoto Interiors",
    country: "Japan",
    flag: "🇯🇵",
    industry: "Retail",
    stage: "Production",
    value: 342_800,
    currency: "USD",
    probability: STAGE_PROBABILITY.Production,
    expectedClose: "Nov 30, 2026",
    owner: { name: "Arjun Mehta", initials: "AM" },
    source: "Referral",
    createdAt: "Jul 15, 2026",
    lastActivity: "12h ago",
    nextStep: "Confirm polishing spec with fabrication",
    quotationRef: "QT-2026-0161",
    orderRef: "SO-2026-0079",
    projectRef: "PRJ-0148",
    contacts: [
      { name: "Haruki Kishimoto", role: "Director", email: "haruki@kishimoto.jp", phone: "+81 3 6812 4400", primary: true },
    ],
    tags: ["Marble", "CIF Yokohama"],
  },
];

export function getOpportunity(id: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.id === id);
}

export const ACTIVITY_TIMELINE: Record<string, Activity[]> = {
  "OPP-2041": [
    { id: "a1", type: "stage", title: "Moved to Negotiation", actor: "Priya Ravi", at: "2h ago" },
    { id: "a2", type: "email", title: "Sent revised pricing worksheet", detail: "Attached: Calacatta_Oro_Rev3.pdf", actor: "Priya Ravi", at: "5h ago" },
    { id: "a3", type: "meeting", title: "Design review call — 45 min", detail: "Discussed slab matching for lobby feature wall", actor: "Priya Ravi", at: "Yesterday" },
    { id: "a4", type: "quote", title: "Quotation QT-2026-0184 sent", actor: "System", at: "3d ago" },
    { id: "a5", type: "note", title: "Client prefers book-matched veining", actor: "Priya Ravi", at: "4d ago" },
    { id: "a6", type: "call", title: "Discovery call — 22 min", actor: "Priya Ravi", at: "1w ago" },
  ],
};

export const FOLLOWUPS: Record<string, FollowUp[]> = {
  "OPP-2041": [
    { id: "f1", title: "Send revised CIF Singapore quote", due: "Today, 4:00 PM", owner: "Priya Ravi", status: "upcoming" },
    { id: "f2", title: "Confirm slab reservation with Livorno WH", due: "Tomorrow", owner: "Operations", status: "upcoming" },
    { id: "f3", title: "Weekly check-in call", due: "Fri, Nov 21", owner: "Priya Ravi", status: "upcoming" },
  ],
};

export function currencyFmt(n: number, ccy: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(n);
}
