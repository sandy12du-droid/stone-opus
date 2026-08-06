import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_inventory",
  title: "Search stone inventory",
  description:
    "Search stone products (slabs and quartz) by name, SKU, color family or finish, returning pricing and specs.",
  inputSchema: {
    query: z.string().trim().describe("Search text matched against product name and SKU."),
    limit: z.number().int().describe("Maximum products to return (1-50).").default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("stone_products")
      .select(
        "id,name,sku,color_family,finish,thickness_mm,list_price_per_m2,price_group,is_new_arrival,tags",
      )
      .limit(take);
    if (query) builder = builder.or(`name.ilike.%${query}%,sku.ilike.%${query}%`);
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
