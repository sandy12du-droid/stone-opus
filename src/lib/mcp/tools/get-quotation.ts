import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_quotation",
  title: "Get quotation detail",
  description:
    "Fetch one quotation by id or quote number, including its line items and commercial totals.",
  inputSchema: {
    quotation: z.string().trim().describe("Quotation id (uuid) or quote number, e.g. Q-2026-0042."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ quotation }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quotation);
    const { data, error } = await supabase
      .from("stone_quotations")
      .select("*, stone_quotation_items(*)")
      .eq(isUuid ? "id" : "number", quotation)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: `No quotation found for "${quotation}".` }],
        isError: true,
      };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { quotation: data },
    };
  },
});
