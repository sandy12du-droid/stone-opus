import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AuthAuditEvent =
  | "sign_in"
  | "sign_out"
  | "failed_login"
  | "password_reset_requested"
  | "password_reset_completed";

const EVENTS: AuthAuditEvent[] = [
  "sign_in",
  "sign_out",
  "failed_login",
  "password_reset_requested",
  "password_reset_completed",
];

export const recordAuthEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { event: string; email?: string; detail?: string }) => {
    if (!EVENTS.includes(input?.event as AuthAuditEvent)) {
      throw new Error("Invalid auth audit event");
    }
    return {
      event: input.event as AuthAuditEvent,
      email: input.email?.slice(0, 320),
      detail: input.detail?.slice(0, 300),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Trust the bearer token (if any) for identity, never the request body.
    let userId: string | null = null;
    const authHeader = getRequestHeader("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }

    await supabaseAdmin.from("auth_audit_logs").insert({
      event: data.event,
      email: data.email ?? null,
      user_id: userId,
      ip_address: getRequestIP({ xForwardedFor: true }) ?? null,
      user_agent: getRequestHeader("user-agent")?.slice(0, 400) ?? null,
      detail: data.detail ?? null,
    });

    return { ok: true };
  });

export const listAuthAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { event?: string; search?: string; limit?: number }) => ({
    event: EVENTS.includes(input?.event as AuthAuditEvent)
      ? (input.event as AuthAuditEvent)
      : undefined,
    search: input?.search?.trim().slice(0, 120) || undefined,
    limit: Math.min(Math.max(input?.limit ?? 100, 1), 500),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    let query = context.supabase
      .from("auth_audit_logs")
      .select("id, event, email, user_id, ip_address, user_agent, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.event) query = query.eq("event", data.event);
    if (data.search) query = query.ilike("email", `%${data.search}%`);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
