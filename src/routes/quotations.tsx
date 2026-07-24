import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — Arquane OS" },
      { name: "description", content: "Enterprise quotation builder for the stone industry — line-item pricing, freight, terms, approvals, and PDF preview." },
      { property: "og:title", content: "Quotations — Arquane OS" },
      { property: "og:description", content: "Enterprise quotation builder for the stone industry — line-item pricing, freight, terms, approvals, and PDF preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotationsPage,
});

type QStatus = "Draft" | "Sent" | "Viewed" | "Accepted" | "Expired" | "Rejected";

interface Quotation {
  id: string;
  number: string;
  customer: string;
  country: string;
  flag: string;
  items: number;
  amount: number;
  currency: string;
  incoterm: string;
  validUntil: string;
  issued: string;
  status: QStatus;
  owner: string;
  ownerInitials: string;
}

const QUOTES: Quotation[] = [
  { id: "Q-2091", number: "ARQ-2091", customer: "Vittoria Stone Group", country: "Italy", flag: "🇮🇹", items: 8, amount: 184500, currency: "EUR", incoterm: "CIF Livorno", validUntil: "Aug 18", issued: "2h ago", status: "Sent", owner: "Sofia Marin", ownerInitials: "SM" },
  { id: "Q-2088", number: "ARQ-2088", customer: "Al Habtoor Marble LLC", country: "UAE", flag: "🇦🇪", items: 12, amount: 342000, currency: "USD", incoterm: "FOB Livorno", validUntil: "Aug 21", issued: "Yesterday", status: "Viewed", owner: "Priya Nair", ownerInitials: "PN" },
  { id: "Q-2085", number: "ARQ-2085", customer: "Granite World USA", country: "USA", flag: "🇺🇸", items: 6, amount: 96400, currency: "USD", incoterm: "CIF Newark", validUntil: "Aug 12", issued: "3d ago", status: "Accepted", owner: "David Ono", ownerInitials: "DO" },
  { id: "Q-2082", number: "ARQ-2082", customer: "Emirates Stone Trading", country: "UAE", flag: "🇦🇪", items: 14, amount: 486200, currency: "USD", incoterm: "CIF Jebel Ali", validUntil: "Aug 25", issued: "4d ago", status: "Sent", owner: "Sofia Marin", ownerInitials: "SM" },
  { id: "Q-2079", number: "ARQ-2079", customer: "Osaka Ishi Trading", country: "Japan", flag: "🇯🇵", items: 5, amount: 72800, currency: "USD", incoterm: "FOB Livorno", validUntil: "Aug 09", issued: "6d ago", status: "Expired", owner: "David Ono", ownerInitials: "DO" },
  { id: "Q-2076", number: "ARQ-2076", customer: "Berlin Stein Werk", country: "Germany", flag: "🇩🇪", items: 4, amount: 58900, currency: "EUR", incoterm: "EXW Livorno", validUntil: "Aug 14", issued: "1w ago", status: "Rejected", owner: "Priya Nair", ownerInitials: "PN" },
  { id: "Q-2073", number: "ARQ-2073", customer: "Marmoles de Sonora", country: "Mexico", flag: "🇲🇽", items: 9, amount: 128400, currency: "USD", incoterm: "CIF Manzanillo", validUntil: "Aug 22", issued: "1w ago", status: "Draft", owner: "Sofia Marin", ownerInitials: "SM" },
  { id: "Q-2070", number: "ARQ-2070", customer: "Cape Stone Co.", country: "South Africa", flag: "🇿🇦", items: 7, amount: 84600, currency: "USD", incoterm: "CIF Cape Town", validUntil: "Aug 27", issued: "9d ago", status: "Viewed", owner: "Sofia Marin", ownerInitials: "SM" },
  { id: "Q-2067", number: "ARQ-2067", customer: "Lima Marmol S.A.C.", country: "Peru", flag: "🇵🇪", items: 3, amount: 41200, currency: "USD", incoterm: "CIF Callao", validUntil: "Aug 30", issued: "10d ago", status: "Draft", owner: "David Ono", ownerInitials: "DO" },
];

const STATUS_STYLES: Record<QStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  Sent: "bg-info/10 text-info border-info/20",
  Viewed: "bg-accent/15 text-accent-foreground border-accent/30",
  Accepted: "bg-success/10 text-success border-success/20",
  Expired: "bg-warning/10 text-warning border-warning/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const currency = (n: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

function QuotationsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return QUOTES.filter((r) => {
      if (status !== "All" && r.status !== status) return false;
      if (!q) return true;
      return r.customer.toLowerCase().includes(q) || r.number.toLowerCase().includes(q) || r.country.toLowerCase().includes(q);
    });
  }, [query, status]);

  const totalOpen = QUOTES.filter((q) => q.status === "Sent" || q.status === "Viewed" || q.status === "Draft").reduce((s, q) => s + q.amount, 0);
  const accepted = QUOTES.filter((q) => q.status === "Accepted").length;
  const winRate = Math.round((accepted / QUOTES.length) * 100);

  const kpis = [
    { label: "Open quotations", value: QUOTES.filter((q) => q.status !== "Accepted" && q.status !== "Rejected" && q.status !== "Expired").length, hint: "5 awaiting response" },
    { label: "Pipeline value", value: currency(totalOpen), hint: "Weighted 62%" },
    { label: "Win rate", value: `${winRate}%`, hint: "Last 30 days" },
    { label: "Avg. quote size", value: currency(QUOTES.reduce((s, q) => s + q.amount, 0) / QUOTES.length), hint: "+8.2% MoM" },
  ];

  const statuses: (QStatus | "All")[] = ["All", "Draft", "Sent", "Viewed", "Accepted", "Expired", "Rejected"];

  return (
    <AppShell
      title="Quotations"
      subtitle="Line-item quotations with freight, incoterms, approvals, and PDF preview."
      actions={
        <>
          <Button size="sm" variant="outline"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> New quotation
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{k.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{k.hint}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, number…" className="pl-9" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-border/60 bg-muted/40 p-1">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition",
                      status === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8"><Filter className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          <Card className="mt-4 border-border/60 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[26%]">Quotation</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Incoterm</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid until</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{q.number}</div>
                          <div className="truncate text-xs text-muted-foreground">Issued {q.issued}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{q.customer}</div>
                      <div className="text-xs text-muted-foreground">{q.flag} {q.country}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{q.items}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{q.incoterm}</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums text-foreground">
                      {currency(q.amount, q.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border font-medium", STATUS_STYLES[q.status])}>{q.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{q.validUntil}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{q.ownerInitials}</AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* PDF preview panel */}
        <div className="space-y-4">
          <Card className="overflow-hidden border-border/60 shadow-md">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</div>
                  <div className="text-sm font-semibold text-foreground">ARQ-2091 · Vittoria Stone Group</div>
                </div>
                <Badge variant="outline" className={cn("border font-medium", STATUS_STYLES.Sent)}>Sent</Badge>
              </div>
            </div>
            <div className="space-y-4 bg-card p-6 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary">Arquane OS</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">Via del Marmo 12 · Livorno, IT</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold tracking-tight text-foreground">QUOTATION</div>
                  <div className="text-xs text-muted-foreground">ARQ-2091</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Bill to</div>
                  <div className="mt-0.5 font-medium text-foreground">Vittoria Stone Group</div>
                  <div className="text-muted-foreground">Via Aurelia 89 · Carrara, IT</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Valid until</div>
                  <div className="mt-0.5 font-medium text-foreground">Aug 18, 2026</div>
                  <div className="text-muted-foreground">CIF Livorno · Net 45</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { name: "Calacatta Viola · 2cm polished", qty: 12, price: 480, total: 27648 },
                  { name: "Statuario Extra · 3cm honed", qty: 6, price: 620, total: 17856 },
                  { name: "Travertino Romano · 2cm", qty: 18, price: 265, total: 22896 },
                  { name: "Freight & handling", qty: 1, price: 4800, total: 4800 },
                ].map((line) => (
                  <div key={line.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-dashed border-border/50 pb-1.5 text-xs">
                    <span className="text-foreground">{line.name}</span>
                    <span className="tabular-nums text-muted-foreground">×{line.qty}</span>
                    <span className="tabular-nums text-muted-foreground">{currency(line.price, "EUR")}</span>
                    <span className="tabular-nums font-medium text-foreground">{currency(line.total, "EUR")}</span>
                  </div>
                ))}
              </div>
              <div className="ml-auto w-full max-w-[240px] space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{currency(168400, "EUR")}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Discount (-3%)</span><span className="tabular-nums">−{currency(5052, "EUR")}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT (22%)</span><span className="tabular-nums">{currency(35935, "EUR")}</span></div>
                <div className="flex justify-between border-t border-border/60 pt-1 text-sm font-semibold text-foreground">
                  <span>Total</span><span className="tabular-nums">{currency(184500, "EUR")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 px-5 py-3">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="mr-1.5 h-3.5 w-3.5" /> Resend
              </Button>
              <Button size="sm" variant="outline"><Download className="mr-1.5 h-3.5 w-3.5" /> PDF</Button>
              <span className="ml-auto text-xs text-muted-foreground">v3 · edited 12m ago</span>
            </div>
          </Card>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> AI quote coach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pb-5 text-xs">
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                <div className="font-semibold text-foreground">Bundle suggestion</div>
                <p className="mt-0.5 text-muted-foreground">Vittoria typically pairs Calacatta with Travertino. +2 slabs could unlock container-rate freight (−€820).</p>
              </div>
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                <div className="font-semibold text-foreground">Follow-up timing</div>
                <p className="mt-0.5 text-muted-foreground">Best time to nudge: Tue 10:00 Rome time. Response rate 3.2× the avg.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Approval workflow</CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <ol className="space-y-2.5 text-xs">
                {[
                  { s: "done", who: "Sofia Marin", note: "Drafted quotation", time: "3h ago" },
                  { s: "done", who: "Priya Nair", note: "Reviewed pricing & margin", time: "2h ago" },
                  { s: "active", who: "David Ono", note: "Awaiting sales director sign-off", time: "" },
                  { s: "pending", who: "Client", note: "Customer decision", time: "" },
                ].map((step) => (
                  <li key={step.who} className="flex items-start gap-2.5">
                    <div className={cn(
                      "mt-0.5 grid h-5 w-5 place-items-center rounded-full border",
                      step.s === "done" && "border-success bg-success/10 text-success",
                      step.s === "active" && "border-accent bg-accent/15 text-accent",
                      step.s === "pending" && "border-border bg-muted text-muted-foreground",
                    )}>
                      {step.s === "done" ? <CheckCircle2 className="h-3 w-3" /> : step.s === "active" ? <Clock className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-40" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground"><span className="font-medium">{step.who}</span> <span className="text-muted-foreground">— {step.note}</span></div>
                      {step.time && <div className="text-[10px] text-muted-foreground">{step.time}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4 text-primary" /> Customer snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pb-5 text-xs">
              <div>
                <div className="text-muted-foreground">Lifetime value</div>
                <div className="font-semibold text-foreground">{currency(4820000)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last order</div>
                <div className="font-semibold text-foreground">3 days ago</div>
              </div>
              <div>
                <div className="text-muted-foreground">Payment health</div>
                <div className="font-semibold text-success">On time · A</div>
              </div>
              <div>
                <div className="text-muted-foreground">Win rate</div>
                <div className="font-semibold text-foreground">78%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
