import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

type AnyTool = { readonly name: string; readonly handler: (args: any, ctx: ToolContext) => any };

async function requestIp(): Promise<string | null> {
  try {
    const mod = await import("@tanstack/react-start/server");
    return mod.getRequestIP({ xForwardedFor: true }) ?? null;
  } catch {
    return null;
  }
}

/** Wraps a tool so every call is recorded in mcp_usage_logs (as the caller, RLS enforced). */
export function withUsageLog<T extends AnyTool>(tool: T): T {
  const handler = async (args: unknown, ctx: ToolContext) => {
    const started = Date.now();
    let outcome: "success" | "error" = "success";
    let errorMessage: string | null = null;
    try {
      const result = await tool.handler(args, ctx);
      if (result && typeof result === "object" && "isError" in result && result.isError) {
        outcome = "error";
        const first = (result as { content?: { type: string; text?: string }[] }).content?.[0];
        errorMessage = first?.text?.slice(0, 300) ?? "Tool error";
      }
      return result;
    } catch (e) {
      outcome = "error";
      errorMessage = (e as Error)?.message?.slice(0, 300) ?? "Unhandled error";
      throw e;
    } finally {
      if (ctx.isAuthenticated()) {
        try {
          await supabaseForUser(ctx).from("mcp_usage_logs").insert({
            tool_name: tool.name,
            user_id: ctx.getUserId() ?? null,
            user_email: ctx.getUserEmail() ?? null,
            client_id: ctx.getClientId() ?? null,
            ip_address: await requestIp(),
            latency_ms: Date.now() - started,
            outcome,
            error_message: errorMessage,
          });
        } catch {
          // Logging must never break the tool call.
        }
      }
    }
  };
  return { ...tool, handler } as T;
}
