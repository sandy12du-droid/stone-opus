import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STATUSES = ["draft", "in_review", "sent", "accepted", "rejected", "expired", "cancelled"] as const;

export default defineTool({
  name: "update_quotation",
  title: "Update quotation",
  description:
    "Update a quotation's status or commercial header fields (project, incoterm, currency, validity, notes). Requires a staff role.",
  inputSchema: {
    id: z.string().uuid().describe("Quotation id (uuid)."),
    status: z.enum(STATUSES).nullable().default(null).describe("New status."),
    project_name: z.string().trim().nullable().default(null),
    incoterm: z.string().trim().nullable().default(null),
    currency: z.string().trim().nullable().default(null),
    valid_until: z.string().trim().nullable().default(null).describe("Validity date, YYYY-MM-DD."),
    notes: z.string().trim().nullable().default(null),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status, ...fields }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) if (v) patch[k] = v;
    if (status) {
      patch["status"] = status;
      if (status === "sent") patch["sent_at"] = new Date().toISOString();
      if (status === "accepted" || status === "rejected") patch["decided_at"] = new Date().toISOString();
    }
    if (Object.keys(patch).length === 0)
      return { content: [{ type: "text", text: "Nothing to update" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("stone_quotations")
      .update(patch as never)
      .eq("id", id)
      .select("id,number,status,project_name,incoterm,currency,valid_until")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: "Quotation not found or you are not allowed to edit it" }],
        isError: true,
      };
    await supabase.from("stone_quotation_events").insert({
      quotation_id: id,
      type: status ?? "updated",
      message: `Updated via agent integration: ${Object.keys(patch).join(", ")}`,
      actor: ctx.getUserEmail() ?? "MCP agent",
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { quotation: data },
    };
  },
});
