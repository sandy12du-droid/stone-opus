import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_shipment_status",
  title: "Update shipment status",
  description:
    "Change a shipment's transit status and record a tracking event. Requires a staff role.",
  inputSchema: {
    id: z.string().uuid().describe("Shipment id (uuid)."),
    status: z
      .enum(["planned", "booked", "in_transit", "at_port", "customs", "arrived", "delivered", "delayed", "cancelled"])
      .describe("New shipment status."),
    location: z.string().trim().nullable().default(null).describe("Current location or port."),
    message: z.string().trim().nullable().default(null).describe("Event note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ id, status, location, message }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const now = new Date().toISOString();
    const patch: Record<string, string> = { status };
    if (status === "in_transit") patch["actual_departure"] = now.slice(0, 10);
    if (status === "arrived" || status === "delivered") patch["actual_arrival"] = now.slice(0, 10);
    const { data, error } = await supabase
      .from("stone_shipments")
      .update(patch)
      .eq("id", id)
      .select("id,reference,status,actual_departure,actual_arrival,eta")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return {
        content: [{ type: "text", text: "Shipment not found or you are not allowed to edit it" }],
        isError: true,
      };
    await supabase.from("stone_shipment_events").insert({
      shipment_id: id,
      event_type: status,
      location,
      message: message ?? `Status updated to ${status} via agent integration`,
      actor: ctx.getUserEmail() ?? "MCP agent",
      occurred_at: now,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { shipment: data },
    };
  },
});
