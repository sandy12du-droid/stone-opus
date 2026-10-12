import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_quotation",
  title: "Create quotation",
  description: "Create a new draft quotation for a customer. Requires a staff role.",
  inputSchema: {
    customer_name: z.string().trim().min(1).describe("Customer contact name."),
    customer_company: z.string().trim().nullable().default(null).describe("Customer company."),
    customer_country: z.string().trim().nullable().default(null).describe("Customer country."),
    project_name: z.string().trim().nullable().default(null).describe("Project name."),
    incoterm: z.string().trim().default("FOB").describe("Incoterm, e.g. FOB, CIF, EXW."),
    currency: z.string().trim().default("USD").describe("ISO currency code."),
    notes: z.string().trim().nullable().default(null).describe("Internal notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("stone_quotations")
      .insert({
        customer_name: input.customer_name,
        customer_company: input.customer_company,
        customer_country: input.customer_country,
        project_name: input.project_name,
        incoterm: input.incoterm,
        currency: input.currency,
        notes: input.notes,
        owner_name: ctx.getUserEmail() ?? "MCP agent",
      })
      .select("id,number,status,customer_name,currency,incoterm")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    await supabase.from("stone_quotation_events").insert({
      quotation_id: data.id,
      type: "created",
      message: `Quotation created via agent integration`,
      actor: ctx.getUserEmail() ?? "MCP agent",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { quotation: data },
    };
  },
});
