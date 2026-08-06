import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_quotations",
  title: "List quotations",
  description:
    "List recent quotations with customer, status, incoterm and totals. Optionally filter by status or customer text.",
  inputSchema: {
    status: z
      .string()
      .trim()
      .describe("Optional status filter, e.g. draft, sent, accepted, rejected.")
      .nullable()
      .default(null),
    customer: z
      .string()
      .trim()
      .describe("Optional text matched against customer name or company.")
      .nullable()
      .default(null),
    limit: z.number().int().describe("Maximum quotations to return (1-50).").default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, customer, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 15, 1), 50);
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("stone_quotations")
      .select(
        "id,number,status,customer_name,customer_company,customer_country,project_name,currency,incoterm,subtotal,total,valid_until,sent_at,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(take);
    if (status) builder = builder.eq("status", status as never);
    if (customer)
      builder = builder.or(
        `customer_name.ilike.%${customer}%,customer_company.ilike.%${customer}%`,
      );
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { quotations: data ?? [] },
    };
  },
});
