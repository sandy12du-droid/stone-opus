import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "track_shipments",
  title: "Track shipments",
  description:
    "List shipments with carrier, container, ports, incoterm, ETD/ETA and current transit status.",
  inputSchema: {
    status: z.string().trim().describe("Optional status filter.").nullable().default(null),
    reference: z
      .string()
      .trim()
      .describe("Optional text matched against shipment reference or container number.")
      .nullable()
      .default(null),
    limit: z.number().int().describe("Maximum shipments to return (1-50).").default(15),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, reference, limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 15, 1), 50);
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("stone_shipments")
      .select(
        "id,reference,status,mode,carrier,container_number,container_type,origin_port,origin_country,destination_port,destination_country,incoterm,etd,eta,actual_departure,actual_arrival,weight_kg,volume_m3",
      )
      .order("updated_at", { ascending: false })
      .limit(take);
    if (status) builder = builder.eq("status", status);
    if (reference)
      builder = builder.or(
        `reference.ilike.%${reference}%,container_number.ilike.%${reference}%`,
      );
    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { shipments: data ?? [] },
    };
  },
});
