import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_product_availability",
  title: "Get slab availability",
  description:
    "List physical slabs for a stone product, with warehouse, dimensions, bin location and reservation status.",
  inputSchema: {
    product_id: z.string().trim().describe("The stone product id (uuid)."),
    status: z
      .string()
      .trim()
      .describe("Optional slab status filter, e.g. available, reserved, sold.")
      .nullable()
      .default(null),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ product_id, status }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("stone_slabs")
      .select(
        "id,slab_number,status,length_cm,width_cm,area_m2,bin_location,reserved_for,reserved_until,warehouse_id,stone_warehouses(name,city,country)",
      )
      .eq("product_id", product_id)
      .limit(200);
    if (status) builder = builder.eq("status", status as never);
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const slabs = data ?? [];
    const totalArea = slabs.reduce((sum, s) => sum + (s.area_m2 ?? 0), 0);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: slabs.length, total_area_m2: totalArea, slabs }, null, 2),
        },
      ],
      structuredContent: { count: slabs.length, total_area_m2: totalArea, slabs },
    };
  },
});
