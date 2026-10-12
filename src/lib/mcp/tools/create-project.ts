import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_project",
  title: "Create project",
  description: "Create a fabrication/supply project. Requires a staff role.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Project name."),
    customer_name: z.string().trim().nullable().default(null),
    customer_country: z.string().trim().nullable().default(null),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    po_number: z.string().trim().nullable().default(null),
    currency: z.string().trim().default("USD"),
    contract_value: z.number().min(0).default(0),
    target_delivery_date: z.string().trim().nullable().default(null).describe("YYYY-MM-DD."),
    notes: z.string().trim().nullable().default(null),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data: codeRow } = await supabase.rpc("generate_project_code");
    const code = (codeRow as string | null) ?? `PRJ-${Date.now()}`;
    const { data, error } = await supabase
      .from("stone_projects")
      .insert({ ...input, code })
      .select("id,code,name,status,priority,contract_value,currency,target_delivery_date")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { project: data },
    };
  },
});
