import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Sparkles,
  FileText, Package, Ship, Receipt, Plus, MoreHorizontal, ExternalLink,
  CheckCircle2, Clock, Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ActivityTimeline, type ActivityEvent } from "@/components/ActivityTimeline";
import { useSetBusinessContext } from "@/context/BusinessContext";
import {
  CUSTOMERS, TIER_STYLES, HEALTH_STYLES, currency, getCustomer,
} from "@/lib/crm-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/crm/customers/$customerId")({
  head: ({ loaderData }) => {
    const c = loaderData as { name?: string } | undefined;
    if (!c?.name) return { meta: [{ title: "Customer — Arquane OS" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${c.name} — Customers · Arquane OS` },
        { name: "description", content: `Account workspace for ${c.name}: projects, orders, quotations, documents and activity.` },
        { property: "og:title", content: `${c.name} — Arquane OS` },
        { property: "og:description", content: `Account workspace for ${c.name} — 360° view.` },
      ],
    };
  },
  loader: ({ params }) => {
    const c = getCustomer(params.customerId);
    if (!c) throw notFound();
    return c;
  },
  notFoundComponent: () => (
    <AppShell title="Customer">
      <div className="text-sm text-muted-foreground">
        Customer not found.{" "}
        <Link to="/crm/customers" className="text-primary underline">Back to customers</Link>
      </div>
    </AppShell>
  ),
  component: CustomerWorkspace,
});

// Cross-domain mock — will be swapped for Supabase reads later.
const PROJECTS_BY_CUSTOMER: Record<string, Array<{ id: string; name: string; code: string; status: string; value: number; due: string }>> = {
  "C-1042": [
    { id: "PRJ-118", name: "Ashford Residence", code: "PRJ-118", status: "In production", value: 184000, due: "Apr 12" },
    { id: "PRJ-121", name: "Ravello Villa", code: "PRJ-121", status: "Design review", value: 96500, due: "May 03" },
  ],
  "C-1039": [
    { id: "PRJ-115", name: "Hilton Tower Lobby", code: "PRJ-115", status: "Shipping", value: 412000, due: "Mar 28" },
  ],
  "C-1036": [
    { id: "PRJ-109", name: "Dallas Flagship Kitchens", code: "PRJ-109", status: "On hold", value: 128000, due: "TBD" },
  ],
};

const ORDERS_BY_CUSTOMER: Record<string, Array<{ id: string; ref: string; status: string; amount: number; date: string }>> = {
  "C-1042": [
    { id: "O-2210", ref: "SO-2210", status: "In production", amount: 92400, date: "Feb 21" },
    { id: "O-2188", ref: "SO-2188", status: "Delivered", amount: 148900, date: "Jan 08" },
  ],
  "C-1039": [{ id: "O-2205", ref: "SO-2205", status: "In transit", amount: 68200, date: "Feb 14" }],
  "C-1036": [{ id: "O-2151", ref: "SO-2151", status: "Delivered", amount: 41200, date: "Dec 12" }],
};

const QUOTES_BY_CUSTOMER: Record<string, Array<{ id: string; number: string; status: string; total: number; date: string }>> = {
  "C-1042": [
    { id: "Q-2418", number: "Q-2418", status: "Approved", total: 184000, date: "Feb 24" },
    { id: "Q-2401", number: "Q-2401", status: "Sent", total: 62500, date: "Feb 09" },
  ],
  "C-1039": [{ id: "Q-2415", number: "Q-2415", status: "Sent", total: 96000, date: "Feb 18" }],
  "C-1036": [{ id: "Q-2392", number: "Q-2392", status: "Draft", total: 24800, date: "Feb 02" }],
};

const DOCS_BY_CUSTOMER: Record<string, Array<{ id: string; name: string; kind: string; date: string }>> = {
  "C-1042": [
    { id: "D-901", name: "Vittoria — MSA 2025.pdf", kind: "Contract", date: "Jan 12" },
    { id: "D-908", name: "Ashford — Shop drawing rev C", kind: "Drawing", date: "Feb 22" },
    { id: "D-912", name: "Packing list PL-2210", kind: "Logistics", date: "Feb 25" },
  ],
  "C-1039": [{ id: "D-880", name: "Hilton Tower — RFQ pack", kind: "RFQ", date: "Feb 03" }],
  "C-1036": [],
};

const TASKS_BY_CUSTOMER: Record<string, Array<{ id: string; title: string; due: string; done: boolean }>> = {
  "C-1042": [
    { id: "T-1", title: "Confirm Ashford install date with GC", due: "Today", done: false },
    { id: "T-2", title: "Send Q-2401 follow-up", due: "Tomorrow", done: false },
    { id: "T-3", title: "Review reorder cadence for Calacatta Viola", due: "Fri", done: false },
    { id: "T-4", title: "Approve Ravello shop drawing rev C", due: "Mar 04", done: true },
  ],
  "C-1039": [{ id: "T-5", title: "Book Hilton Tower vessel — MSC", due: "Wed", done: false }],
  "C-1036": [{ id: "T-6", title: "Quarterly review call", due: "Mar 08", done: false }],
};

const MEETINGS_BY_CUSTOMER: Record<string, Array<{ id: string; title: string; when: string; who: string }>> = {
  "C-1042": [
    { id: "M-1", title: "Ashford install walkthrough", when: "Wed · 3:00 PM CET", who: "GC + Ops" },
    { id: "M-2", title: "Portfolio QBR", when: "Mar 12 · 10:00 AM", who: "Sofia + Finance" },
  ],
  "C-1039": [{ id: "M-3", title: "Hilton Tower kickoff", when: "Thu · 11:00 AM GST", who: "Priya + Client" }],
  "C-1036": [],
};

const RESERVED_BY_CUSTOMER: Record<string, Array<{ id: string; name: string; slabs: number; where: string }>> = {
  "C-1042": [
    { id: "R-1", name: "Calacatta Viola 3cm", slabs: 8, where: "Warehouse A · Livorno" },
    { id: "R-2", name: "Statuario Extra 2cm", slabs: 4, where: "Warehouse A · Livorno" },
  ],
  "C-1039": [{ id: "R-3", name: "Nero Marquina 2cm", slabs: 6, where: "Warehouse B · Jebel Ali" }],
  "C-1036": [],
};

const CONTAINERS_BY_CUSTOMER: Record<string, Array<{ id: string; ref: string; status: string; eta: string }>> = {
  "C-1042": [
    { id: "CNT-0091", ref: "MSC Loreto · CNT-0091", status: "Dispatched", eta: "Mar 04" },
    { id: "CNT-0092", ref: "CNT-0092 · consolidating", status: "Loading", eta: "Mar 18" },
  ],
  "C-1039": [{ id: "CNT-0088", ref: "Maersk Dubai · CNT-0088", status: "In transit", eta: "Mar 09" }],
  "C-1036": [],
};

const PAYMENTS_BY_CUSTOMER: Record<string, Array<{ id: string; invoice: string; amount: number; due: string; state: "due" | "overdue" | "paid" }>> = {
  "C-1042": [
    { id: "P-1", invoice: "INV-2210", amount: 92400, due: "Mar 08", state: "due" },
    { id: "P-2", invoice: "INV-2188", amount: 148900, due: "Feb 08", state: "paid" },
  ],
  "C-1039": [{ id: "P-3", invoice: "INV-2205", amount: 68200, due: "Feb 26", state: "overdue" }],
  "C-1036": [{ id: "P-4", invoice: "INV-2151", amount: 41200, due: "Jan 12", state: "paid" }],
};

const EMAILS_BY_CUSTOMER: Record<string, Array<{ id: string; subject: string; from: string; at: string }>> = {
  "C-1042": [
    { id: "E-1", subject: "Re: Ashford install window", from: "gc@ashfordbuild.com", at: "2h ago" },
    { id: "E-2", subject: "Reorder — Calacatta Viola", from: "orders@vittoriastone.it", at: "Yesterday" },
  ],
  "C-1039": [{ id: "E-3", subject: "Hilton Tower — final specs", from: "procure@habtoormarble.ae", at: "Yesterday" }],
  "C-1036": [],
};

const NOTES_BY_CUSTOMER: Record<string, Array<{ id: string; body: string; author: string; at: string }>> = {
  "C-1042": [
    { id: "N-1", body: "Prefers Livorno consolidation. Loves vein-matched pairs — always send bookmatch preview.", author: "Sofia Marin", at: "Feb 21" },
    { id: "N-2", body: "Finance ok with net-45 for orders above $80k.", author: "David Ono", at: "Jan 14" },
  ],
  "C-1039": [{ id: "N-3", body: "Escalate through Fahad on tight deadlines.", author: "Priya Nair", at: "Feb 10" }],
  "C-1036": [],
};

const ACTIVITY_BY_CUSTOMER: Record<string, ActivityEvent[]> = {
  "C-1042": [
    { id: "A-1", kind: "status",   title: "Q-2418 approved",              actor: "Sofia Marin", at: "2h ago", meta: "Quotation" },
    { id: "A-2", kind: "email",    title: "Reply: Ashford install window", actor: "GC (Ashford)", at: "3h ago" },
    { id: "A-3", kind: "document", title: "Ashford shop drawing rev C uploaded", actor: "Design team", at: "Yesterday" },
    { id: "A-4", kind: "comment",  title: "Reorder cadence looks 6 days early", description: "Calacatta Viola trending faster than the 42-day baseline.", actor: "David Ono", at: "Yesterday" },
    { id: "A-5", kind: "task",     title: "Approve Ravello shop drawing rev C", actor: "Sofia Marin", at: "Feb 22" },
    { id: "A-6", kind: "created",  title: "Project PRJ-121 · Ravello Villa opened", actor: "Sofia Marin", at: "Feb 09" },
  ],
  "C-1039": [
    { id: "A-7", kind: "email",    title: "Hilton Tower final specs received", actor: "Al Habtoor", at: "Yesterday" },
    { id: "A-8", kind: "status",   title: "SO-2205 marked in transit",         actor: "Logistics",   at: "Feb 22" },
  ],
  "C-1036": [
    { id: "A-9", kind: "status",   title: "Health flagged: At risk",           actor: "Signal engine", at: "Feb 20" },
  ],
};

function CustomerWorkspace() {
  const { customerId } = Route.useParams();
  const customer = getCustomer(customerId);

  useSetBusinessContext(
    customer
      ? {
          kind: "customer",
          id: customer.id,
          label: customer.name,
          sublabel: `${customer.flag} ${customer.country} · ${customer.segment}`,
          href: `/crm/customers/${customer.id}`,
          meta: { tier: customer.tier, health: customer.health, owner: customer.owner },
        }
      : null,
  );

  if (!customer) return null;

  const projects = PROJECTS_BY_CUSTOMER[customer.id] ?? [];
  const orders = ORDERS_BY_CUSTOMER[customer.id] ?? [];
  const quotes = QUOTES_BY_CUSTOMER[customer.id] ?? [];
  const docs = DOCS_BY_CUSTOMER[customer.id] ?? [];
  const tasks = TASKS_BY_CUSTOMER[customer.id] ?? [];
  const meetings = MEETINGS_BY_CUSTOMER[customer.id] ?? [];
  const reserved = RESERVED_BY_CUSTOMER[customer.id] ?? [];
  const containers = CONTAINERS_BY_CUSTOMER[customer.id] ?? [];
  const payments = PAYMENTS_BY_CUSTOMER[customer.id] ?? [];
  const emails = EMAILS_BY_CUSTOMER[customer.id] ?? [];
  const notes = NOTES_BY_CUSTOMER[customer.id] ?? [];
  const activity = ACTIVITY_BY_CUSTOMER[customer.id] ?? [];

  const outstanding = payments
    .filter((p) => p.state !== "paid")
    .reduce((s, p) => s + p.amount, 0);
  const openOpps = quotes.filter((q) => q.status !== "Approved" && q.status !== "Rejected").length;

  return (
    <AppShell
      title={customer.name}
      subtitle={`${customer.flag} ${customer.city ?? customer.country} · ${customer.segment} · Customer since ${customer.since ?? "—"}`}
      actions={
        <>
          <Button asChild size="sm" variant="ghost">
            <Link to="/crm/customers"><ArrowLeft className="mr-1 h-4 w-4" /> All customers</Link>
          </Button>
          <Button size="sm" variant="outline"><Mail className="mr-1.5 h-4 w-4" /> Email</Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Quotation
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — Customer information */}
        <aside className="col-span-12 space-y-4 lg:col-span-3">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-foreground">{customer.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={cn("border font-medium", TIER_STYLES[customer.tier])}>{customer.tier}</Badge>
                    <Badge variant="outline" className={cn("border font-medium", HEALTH_STYLES[customer.health])}>{customer.health}</Badge>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <dl className="space-y-2.5 text-sm">
                <Row icon={Mail} label="Email" value={customer.email ?? "—"} />
                <Row icon={Phone} label="Phone" value={customer.phone ?? "—"} />
                <Row icon={MapPin} label="Location" value={`${customer.city ?? ""}${customer.city ? ", " : ""}${customer.country}`} />
                <Row icon={Calendar} label="Since" value={customer.since ?? "—"} />
              </dl>
              <Separator className="my-4" />
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account owner</div>
              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{customer.ownerInitials}</AvatarFallback>
                </Avatar>
                <div className="text-sm text-foreground">{customer.owner}</div>
              </div>
            </CardContent>
          </Card>

          <StatBlock
            items={[
              { label: "Lifetime value", value: currency(customer.ltv) },
              { label: "YTD revenue", value: currency(customer.ytd), hint: `${customer.yoy >= 0 ? "+" : ""}${customer.yoy.toFixed(1)}% YoY` },
              { label: "Orders placed", value: customer.orders.toString() },
              { label: "Outstanding", value: currency(outstanding), hint: outstanding > 0 ? "Open invoices" : "All clear" },
            ]}
          />

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3 pb-5">
              {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
                  <p className="text-foreground/85">{n.body}</p>
                  <div className="mt-1.5 text-[11px] text-muted-foreground">{n.author} · {n.at}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* MIDDLE — Projects, orders, quotations, documents, activity */}
        <section className="col-span-12 space-y-4 lg:col-span-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Projects" icon={Package} count={projects.length}>
              {projects.length === 0 && <Empty label="No active projects." />}
              {projects.map((p) => (
                <RowLink
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  primary={p.name}
                  secondary={`${p.code} · ${p.status}`}
                  right={<span className="text-xs font-medium tabular-nums text-foreground">{currency(p.value)}</span>}
                />
              ))}
            </SectionCard>

            <SectionCard title="Orders" icon={Receipt} count={orders.length}>
              {orders.length === 0 && <Empty label="No orders yet." />}
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{o.ref}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{o.status} · {o.date}</div>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-foreground">{currency(o.amount)}</span>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="Quotations" icon={FileText} count={quotes.length}>
              {quotes.length === 0 && <Empty label="No quotations." />}
              {quotes.map((q) => (
                <RowLink
                  key={q.id}
                  to="/quotations/$quotationId"
                  params={{ quotationId: q.id }}
                  primary={q.number}
                  secondary={`${q.status} · ${q.date}`}
                  right={<span className="text-xs font-medium tabular-nums text-foreground">{currency(q.total)}</span>}
                />
              ))}
            </SectionCard>

            <SectionCard title="Documents" icon={FileText} count={docs.length}>
              {docs.length === 0 && <Empty label="No documents." />}
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{d.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{d.kind} · {d.date}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </SectionCard>
          </div>

          <Tabs defaultValue="activity">
            <TabsList>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="emails">Recent emails</TabsTrigger>
              <TabsTrigger value="inventory">Reserved inventory</TabsTrigger>
              <TabsTrigger value="containers">Containers</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-5">
                  <ActivityTimeline events={activity} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emails" className="mt-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="divide-y divide-border/60 p-0">
                  {emails.length === 0 && <div className="p-5"><Empty label="No recent emails." /></div>}
                  {emails.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{e.subject}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{e.from}</div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{e.at}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="mt-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="divide-y divide-border/60 p-0">
                  {reserved.length === 0 && <div className="p-5"><Empty label="No reserved inventory." /></div>}
                  {reserved.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{r.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{r.where}</div>
                      </div>
                      <span className="text-xs font-medium tabular-nums text-foreground">{r.slabs} slabs</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="containers" className="mt-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="divide-y divide-border/60 p-0">
                  {containers.length === 0 && <div className="p-5"><Empty label="No active containers." /></div>}
                  {containers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0 flex items-center gap-2">
                        <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-foreground">{c.ref}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.status}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">ETA {c.eta}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-3">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="divide-y divide-border/60 p-0">
                  {payments.length === 0 && <div className="p-5"><Empty label="No open payments." /></div>}
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{p.invoice}</div>
                        <div className="truncate text-[11px] text-muted-foreground">Due {p.due}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium tabular-nums text-foreground">{currency(p.amount)}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border font-medium",
                            p.state === "paid" && "bg-success/10 text-success border-success/20",
                            p.state === "due" && "bg-warning/10 text-warning border-warning/20",
                            p.state === "overdue" && "bg-destructive/10 text-destructive border-destructive/20",
                          )}
                        >
                          {p.state === "paid" ? "Paid" : p.state === "due" ? "Due" : "Overdue"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* RIGHT — Tasks, meetings, AI, quick actions */}
        <aside className="col-span-12 space-y-4 lg:col-span-3">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Plus className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-2 pb-5">
              {tasks.length === 0 && <Empty label="No tasks." />}
              {tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2 rounded-md px-1 py-1.5">
                  <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", t.done ? "text-success" : "text-muted-foreground")} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-[13px]", t.done ? "text-muted-foreground line-through" : "text-foreground")}>{t.title}</div>
                    <div className="text-[11px] text-muted-foreground">Due {t.due}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Upcoming meetings</CardTitle></CardHeader>
            <CardContent className="space-y-2 pb-5">
              {meetings.length === 0 && <Empty label="Nothing scheduled." />}
              {meetings.map((m) => (
                <div key={m.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {m.title}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{m.when}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {m.who}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> AI suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-5 text-xs text-muted-foreground">
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                Placeholder — AI recommendations will populate here once the AI layer is connected.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Quick actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 pb-5">
              <QuickBtn icon={FileText} label="New quotation" />
              <QuickBtn icon={Package} label="Reserve slabs" />
              <QuickBtn icon={Mail} label="Send email" />
              <QuickBtn icon={MoreHorizontal} label="More" />
            </CardContent>
          </Card>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground">
            {openOpps} open opportunit{openOpps === 1 ? "y" : "ies"} · {reserved.length} reserved SKU{reserved.length === 1 ? "" : "s"}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

/* ------------ small local building blocks ------------ */

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function StatBlock({ items }: { items: Array<{ label: string; value: string; hint?: string }> }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="grid grid-cols-2 gap-4 p-5">
        {items.map((i) => (
          <div key={i.label}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{i.label}</div>
            <div className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">{i.value}</div>
            {i.hint && <div className="text-[11px] text-muted-foreground">{i.hint}</div>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title, icon: Icon, count, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" /> {title}
          <span className="text-[11px] font-normal text-muted-foreground">· {count}</span>
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Plus className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-0.5 pb-4">{children}</CardContent>
    </Card>
  );
}

function RowLink({
  to, params, primary, secondary, right,
}: {
  to: string;
  params: Record<string, string>;
  primary: string;
  secondary: string;
  right?: React.ReactNode;
}) {
  return (
    <Link
      to={to as never}
      params={params as never}
      className="flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-foreground">{primary}</div>
        <div className="truncate text-[11px] text-muted-foreground">{secondary}</div>
      </div>
      {right}
    </Link>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="px-2 py-3 text-xs text-muted-foreground">{label}</div>;
}

function QuickBtn({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Button variant="outline" size="sm" className="h-9 justify-start gap-2 text-xs">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
