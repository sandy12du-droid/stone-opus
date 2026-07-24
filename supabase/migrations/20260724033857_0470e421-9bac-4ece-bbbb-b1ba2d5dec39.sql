
-- PROJECTS
CREATE TABLE public.stone_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  customer_name text,
  customer_country text,
  quotation_id uuid REFERENCES public.stone_quotations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planning',
  priority text NOT NULL DEFAULT 'normal',
  po_number text,
  currency text NOT NULL DEFAULT 'USD',
  contract_value numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  target_delivery_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_projects TO authenticated;
GRANT ALL ON public.stone_projects TO service_role;
GRANT SELECT ON public.stone_projects TO anon;
ALTER TABLE public.stone_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects readable" ON public.stone_projects FOR SELECT USING (true);
CREATE POLICY "projects writable by auth" ON public.stone_projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER stone_projects_touch BEFORE UPDATE ON public.stone_projects
  FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

-- WORK ORDERS
CREATE TABLE public.stone_work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.stone_projects(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  product_id uuid REFERENCES public.stone_products(id) ON DELETE SET NULL,
  slab_id uuid REFERENCES public.stone_slabs(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'slab',
  stage text NOT NULL DEFAULT 'queued',
  status text NOT NULL DEFAULT 'open',
  assigned_to text,
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_work_orders TO authenticated;
GRANT ALL ON public.stone_work_orders TO service_role;
GRANT SELECT ON public.stone_work_orders TO anon;
ALTER TABLE public.stone_work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_orders readable" ON public.stone_work_orders FOR SELECT USING (true);
CREATE POLICY "work_orders writable by auth" ON public.stone_work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER stone_work_orders_touch BEFORE UPDATE ON public.stone_work_orders
  FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

-- PRODUCTION EVENTS
CREATE TABLE public.stone_production_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id uuid NOT NULL REFERENCES public.stone_work_orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_stage text,
  to_stage text,
  actor text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_production_events TO authenticated;
GRANT ALL ON public.stone_production_events TO service_role;
GRANT SELECT ON public.stone_production_events TO anon;
ALTER TABLE public.stone_production_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod_events readable" ON public.stone_production_events FOR SELECT USING (true);
CREATE POLICY "prod_events writable by auth" ON public.stone_production_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sequence for project codes
CREATE SEQUENCE IF NOT EXISTS public.stone_project_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS public.stone_work_order_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS text LANGUAGE sql SET search_path TO 'public' AS $$
  SELECT 'PRJ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.stone_project_seq')::text, 4, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_work_order_code()
RETURNS text LANGUAGE sql SET search_path TO 'public' AS $$
  SELECT 'WO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.stone_work_order_seq')::text, 5, '0');
$$;

-- Seed a few demo projects and work orders
INSERT INTO public.stone_projects (code, name, customer_name, customer_country, status, priority, po_number, currency, contract_value, start_date, target_delivery_date, notes) VALUES
  (public.generate_project_code(), 'Manhattan Tower — Lobby Cladding', 'Halcyon Interiors', 'USA', 'in_production', 'high', 'PO-88421', 'USD', 184500, current_date - 12, current_date + 18, 'Book-matched Calacatta feature wall'),
  (public.generate_project_code(), 'KL Sentral Residences — Kitchen Package', 'Anantara Developments', 'Malaysia', 'planning', 'normal', 'PO-11238', 'USD', 96200, current_date - 3, current_date + 42, '38 units, quartz countertops'),
  (public.generate_project_code(), 'Chennai IT Park — Reception Feature', 'Meridian Build', 'India', 'in_production', 'critical', 'PO-77105', 'USD', 62800, current_date - 20, current_date + 6, 'Rush order — client event Dec 5'),
  (public.generate_project_code(), 'Miami Beach Villa — Bathroom Suite', 'Aegean Design Studio', 'USA', 'qc', 'normal', 'PO-90014', 'USD', 41300, current_date - 30, current_date + 4, 'Awaiting final polish inspection'),
  (public.generate_project_code(), 'Singapore Boutique Hotel — Floor Tiles', 'Lumen Hospitality', 'Singapore', 'ready_to_ship', 'high', 'PO-55632', 'USD', 128900, current_date - 45, current_date + 2, 'Container booked for next Tuesday');

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT id, status FROM public.stone_projects LOOP
    INSERT INTO public.stone_work_orders (project_id, code, title, quantity, unit, stage, status, assigned_to, due_date)
    VALUES
      (p.id, public.generate_work_order_code(), 'Slab preparation',   6, 'slab',
       CASE p.status WHEN 'planning' THEN 'queued' WHEN 'in_production' THEN 'cutting' WHEN 'qc' THEN 'qc' WHEN 'ready_to_ship' THEN 'packaging' ELSE 'queued' END,
       'open', 'Slab Team A', current_date + 5),
      (p.id, public.generate_work_order_code(), 'CNC cutting & edging', 4, 'panel',
       CASE p.status WHEN 'planning' THEN 'queued' WHEN 'in_production' THEN 'polishing' WHEN 'qc' THEN 'qc' WHEN 'ready_to_ship' THEN 'packaging' ELSE 'queued' END,
       'open', 'Fabrication Cell 2', current_date + 8),
      (p.id, public.generate_work_order_code(), 'QC & packaging', 1, 'lot',
       CASE p.status WHEN 'ready_to_ship' THEN 'packaging' WHEN 'qc' THEN 'qc' ELSE 'queued' END,
       CASE p.status WHEN 'ready_to_ship' THEN 'open' ELSE 'open' END,
       'QC Team', current_date + 12);
  END LOOP;
END $$;
