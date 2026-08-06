import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description:
    "List fabrication/supply projects with status, priority, contract value and target delivery dates.",
  inputSchema: {
    status: z.string().trim().describe("Optional status filter.").nullable().default(null),
    limit: z.number().int().describe("Maximum projects to return (1-50).").default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 15, 1), 50);
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("stone_projects")
      .select(
        "id,code,name,status,priority,customer_name,customer_country,contract_value,currency,start_date,target_delivery_date,po_number",
      )
      .order("updated_at", { ascending: false })
      .limit(take);
    if (status) builder = builder.eq("status", status);
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
