ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'production';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'logistics';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

CREATE TABLE public.auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL CHECK (event IN ('sign_in','sign_out','failed_login','password_reset_requested','password_reset_completed')),
  email text,
  user_id uuid,
  ip_address text,
  user_agent text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_audit_logs_created_at_idx ON public.auth_audit_logs (created_at DESC);
CREATE INDEX auth_audit_logs_event_idx ON public.auth_audit_logs (event);

GRANT SELECT ON public.auth_audit_logs TO authenticated;
GRANT ALL ON public.auth_audit_logs TO service_role;

ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view auth audit logs"
ON public.auth_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));