create table public.mcp_usage_logs (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  user_id uuid,
  user_email text,
  client_id text,
  ip_address text,
  latency_ms integer not null default 0,
  outcome text not null check (outcome in ('success','error')),
  error_message text,
  created_at timestamptz not null default now()
);
create index mcp_usage_logs_created_idx on public.mcp_usage_logs(created_at desc);
alter table public.mcp_usage_logs enable row level security;
grant select, insert on public.mcp_usage_logs to authenticated;
create policy "users insert own mcp logs" on public.mcp_usage_logs for insert to authenticated with check (user_id = auth.uid());
create policy "admins read mcp logs" on public.mcp_usage_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "users read own mcp logs" on public.mcp_usage_logs for select to authenticated using (user_id = auth.uid());