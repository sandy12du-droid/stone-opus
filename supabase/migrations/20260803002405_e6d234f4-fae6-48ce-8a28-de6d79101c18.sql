-- 1. Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'));
$$;

-- 2. Drop all existing public-read and permissive-write policies on sensitive tables
DROP POLICY IF EXISTS "Quotations are publicly readable" ON public.stone_quotations;
DROP POLICY IF EXISTS "Quotation items are publicly readable" ON public.stone_quotation_items;
DROP POLICY IF EXISTS "Quotation events are publicly readable" ON public.stone_quotation_events;
DROP POLICY IF EXISTS "Slabs are publicly readable" ON public.stone_slabs;
DROP POLICY IF EXISTS "projects readable" ON public.stone_projects;
DROP POLICY IF EXISTS "projects writable by auth" ON public.stone_projects;
DROP POLICY IF EXISTS "work_orders readable" ON public.stone_work_orders;
DROP POLICY IF EXISTS "work_orders writable by auth" ON public.stone_work_orders;
DROP POLICY IF EXISTS "prod_events readable" ON public.stone_production_events;
DROP POLICY IF EXISTS "prod_events writable by auth" ON public.stone_production_events;
DROP POLICY IF EXISTS "shipments readable" ON public.stone_shipments;
DROP POLICY IF EXISTS "shipments writable by auth" ON public.stone_shipments;
DROP POLICY IF EXISTS "shipment_items readable" ON public.stone_shipment_items;
DROP POLICY IF EXISTS "shipment_items writable by auth" ON public.stone_shipment_items;
DROP POLICY IF EXISTS "shipment_events readable" ON public.stone_shipment_events;
DROP POLICY IF EXISTS "shipment_events writable by auth" ON public.stone_shipment_events;

-- 3. Revoke anon access on sensitive tables, grant to authenticated/service_role
REVOKE ALL ON public.stone_quotations, public.stone_quotation_items, public.stone_quotation_events,
  public.stone_slabs, public.stone_projects, public.stone_work_orders, public.stone_production_events,
  public.stone_shipments, public.stone_shipment_items, public.stone_shipment_events FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_quotations, public.stone_quotation_items,
  public.stone_quotation_events, public.stone_slabs, public.stone_projects, public.stone_work_orders,
  public.stone_production_events, public.stone_shipments, public.stone_shipment_items,
  public.stone_shipment_events TO authenticated;

GRANT ALL ON public.stone_quotations, public.stone_quotation_items, public.stone_quotation_events,
  public.stone_slabs, public.stone_projects, public.stone_work_orders, public.stone_production_events,
  public.stone_shipments, public.stone_shipment_items, public.stone_shipment_events TO service_role;

-- 4. Authenticated-only reads + staff-only writes
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'stone_quotations','stone_quotation_items','stone_quotation_events','stone_slabs',
    'stone_projects','stone_work_orders','stone_production_events',
    'stone_shipments','stone_shipment_items','stone_shipment_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth read %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "auth read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff insert %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "staff insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff update %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "staff update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff delete %1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "staff delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.is_staff(auth.uid()))', t);
  END LOOP;
END $$;