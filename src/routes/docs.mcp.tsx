import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/docs/mcp")({
  head: () => ({
    meta: [
      { title: "MCP Developer Docs — Arquane OS" },
      { name: "description", content: "Connect AI agents to Arquane OS over MCP: OAuth flow, tools, permissions and example calls." },
      { property: "og:title", content: "MCP Developer Docs — Arquane OS" },
      { property: "og:description", content: "OAuth flow, tool reference and example calls for the Arquane OS MCP server." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocsPage,
});

const TOOLS: [string, string, string][] = [
  ["search_inventory", "Read", "Search stone products by name, SKU, color or finish."],
  ["get_product_availability", "Read", "Slab-level stock, warehouse, bin and reservation status."],
  ["list_quotations", "Read", "Recent quotations, filter by status or customer."],
  ["get_quotation", "Read", "One quotation with line items and totals."],
  ["list_projects", "Read", "Projects with status, priority, value and dates."],
  ["track_shipments", "Read", "Shipments with carrier, container, ports and ETA."],
  ["create_quotation", "Write", "Create a draft quotation for a customer."],
  ["update_quotation", "Write", "Change status, incoterm, currency, validity or notes."],
  ["create_project", "Write", "Create a fabrication/supply project."],
  ["update_shipment_status", "Write", "Move a shipment to a new status and log an event."],
];

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-[12px] leading-relaxed text-foreground">
      {children}
    </pre>
  );
}
function H({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-lg font-semibold text-foreground">{children}</h2>;
}

function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-[14px] leading-relaxed text-foreground">
      <Link to="/settings/agent-integrations" className="text-[12px] text-primary">← Agent Integrations</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Arquane OS MCP server</h1>
      <p className="mt-3 text-muted-foreground">
        Arquane OS exposes a Model Context Protocol server so AI assistants (Claude, ChatGPT, Cursor and others)
        can read inventory and run sales and logistics workflows as a signed-in user.
      </p>

      <H>Endpoint</H>
      <Code>{`POST https://stone-opus.lovable.app/mcp
Transport: Streamable HTTP
Discovery: /.well-known/oauth-protected-resource`}</Code>

      <H>OAuth flow</H>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
        <li>The client calls <code>/mcp</code> without a token and receives <code>401</code> with a <code>WWW-Authenticate</code> header pointing at the protected-resource metadata.</li>
        <li>The client discovers the authorization server and registers itself (dynamic client registration).</li>
        <li>The user is sent to the Arquane consent screen, signs in if needed, and approves or denies access.</li>
        <li>The client exchanges the code (PKCE) for an access token and sends it as <code>Authorization: Bearer …</code>.</li>
        <li>Access can be revoked at any time from Settings → Agent Integrations.</li>
      </ol>

      <H>Scopes & permissions</H>
      <p className="mt-3 text-muted-foreground">
        No OAuth scopes are required — tokens carry the user's identity, and every call runs with that user's
        database permissions. Read tools work for any signed-in user. Write tools require a staff role
        (admin, manager, sales, production or logistics); viewers receive a permission error. Only tokens issued
        through the OAuth flow are accepted; copied browser session tokens are rejected.
      </p>

      <H>Tools</H>
      <table className="mt-3 w-full text-left text-[13px]">
        <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr><th className="py-2">Tool</th><th className="py-2">Type</th><th className="py-2">Description</th></tr>
        </thead>
        <tbody>
          {TOOLS.map(([n, t, d]) => (
            <tr key={n} className="border-b border-border/60">
              <td className="py-2 font-mono text-[12px]">{n}</td>
              <td className="py-2">{t}</td>
              <td className="py-2 text-muted-foreground">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <H>Example calls</H>
      <Code>{`curl -X POST https://stone-opus.lovable.app/mcp \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"search_inventory","arguments":{"query":"Calacatta","limit":5}}}'`}</Code>
      <div className="mt-3" />
      <Code>{`{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
  "name":"update_shipment_status",
  "arguments":{"id":"<shipment-uuid>","status":"in_transit","location":"Mundra Port"}}}`}</Code>

      <H>Auditing</H>
      <p className="mt-3 text-muted-foreground">
        Every tool call is recorded with tool name, user, client, IP, latency and outcome. Administrators can review
        them in Settings → MCP Usage Logs.
      </p>
    </main>
  );
}
