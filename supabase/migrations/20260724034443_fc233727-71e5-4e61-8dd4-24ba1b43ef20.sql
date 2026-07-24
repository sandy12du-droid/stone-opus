
CREATE TABLE public.stone_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  carrier text,
  mode text NOT NULL DEFAULT 'sea',
  container_number text,
  container_type text,
  bill_of_lading text,
  incoterm text DEFAULT 'FOB',
  origin_port text,
  origin_country text,
  destination_port text,
  destination_country text,
  etd date,
  eta date,
  actual_departure date,
  actual_arrival date,
  status text NOT NULL DEFAULT 'planned',
  weight_kg numeric(12,2),
  volume_m3 numeric(10,2),
  freight_cost numeric(12,2),
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_shipments TO authenticated;
GRANT ALL ON public.stone_shipments TO service_role;
GRANT SELECT ON public.stone_shipments TO anon;
ALTER TABLE public.stone_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments readable" ON public.stone_shipments FOR SELECT USING (true);
CREATE POLICY "shipments writable by auth" ON public.stone_shipments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER stone_shipments_touch BEFORE UPDATE ON public.stone_shipments
  FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

CREATE TABLE public.stone_shipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.stone_shipments(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.stone_projects(id) ON DELETE SET NULL,
  quotation_id uuid REFERENCES public.stone_quotations(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'slab',
  weight_kg numeric(10,2),
  volume_m3 numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_shipment_items TO authenticated;
GRANT ALL ON public.stone_shipment_items TO service_role;
GRANT SELECT ON public.stone_shipment_items TO anon;
ALTER TABLE public.stone_shipment_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipment_items readable" ON public.stone_shipment_items FOR SELECT USING (true);
CREATE POLICY "shipment_items writable by auth" ON public.stone_shipment_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.stone_shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.stone_shipments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  location text,
  message text,
  actor text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_shipment_events TO authenticated;
GRANT ALL ON public.stone_shipment_events TO service_role;
GRANT SELECT ON public.stone_shipment_events TO anon;
ALTER TABLE public.stone_shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipment_events readable" ON public.stone_shipment_events FOR SELECT USING (true);
CREATE POLICY "shipment_events writable by auth" ON public.stone_shipment_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE SEQUENCE IF NOT EXISTS public.stone_shipment_seq START 1001;
CREATE OR REPLACE FUNCTION public.generate_shipment_reference()
RETURNS text LANGUAGE sql SET search_path TO 'public' AS $$
  SELECT 'SHP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.stone_shipment_seq')::text, 4, '0');
$$;

-- Seed demo shipments
INSERT INTO public.stone_shipments
  (reference, carrier, mode, container_number, container_type, bill_of_lading, incoterm,
   origin_port, origin_country, destination_port, destination_country,
   etd, eta, actual_departure, actual_arrival, status, weight_kg, volume_m3, freight_cost, notes) VALUES
  (public.generate_shipment_reference(), 'Maersk',    'sea', 'MSKU7823145', '40HC', 'MAEU4451220', 'CIF',
   'Livorno',   'Italy',    'Newark',    'USA',       current_date - 12, current_date + 4,  current_date - 10, NULL,
   'in_transit', 24500, 65.2, 4800, 'Calacatta bundle for Manhattan Tower'),
  (public.generate_shipment_reference(), 'CMA CGM',   'sea', 'CMAU5590018', '20GP', 'CMAU880231',  'FOB',
   'Chennai',   'India',    'Port Klang','Malaysia',  current_date + 3,  current_date + 21, NULL, NULL,
   'booked',     18200, 32.4, 2100, 'Quartz slabs — KL Sentral kitchens'),
  (public.generate_shipment_reference(), 'Hapag-Lloyd','sea','HLXU2233890', '40HC', 'HLCU990112',  'CIF',
   'Livorno',   'Italy',    'Singapore', 'Singapore', current_date - 30, current_date - 2,  current_date - 28, current_date - 2,
   'arrived',    26800, 68.1, 5100, 'Hotel floor tile package — awaiting customs'),
  (public.generate_shipment_reference(), 'DHL',       'air', NULL,           NULL,   'DHL77821459', 'DAP',
   'Milan',     'Italy',    'Miami',     'USA',       current_date - 5,  current_date - 1,  current_date - 5, current_date - 1,
   'delivered',  850,   1.8,  3400, 'Book-match samples for Miami villa'),
  (public.generate_shipment_reference(), 'MSC',       'sea', 'MSCU4471223', '40HC', 'MSCU771182',  'FOB',
   'Newark',    'USA',      'Rotterdam', 'Netherlands', current_date + 10, current_date + 35, NULL, NULL,
   'planned',    NULL,  NULL, NULL, 'Return of surplus slabs to European stockyard');

-- Link shipments to projects (best effort based on name match)
INSERT INTO public.stone_shipment_items (shipment_id, project_id, description, quantity, unit, weight_kg, volume_m3)
SELECT s.id, p.id, p.name, 8, 'slab', 24000, 62
FROM public.stone_shipments s
JOIN public.stone_projects p ON p.name ILIKE '%Manhattan%'
WHERE s.reference LIKE 'SHP-%' AND s.destination_port = 'Newark';

INSERT INTO public.stone_shipment_items (shipment_id, project_id, description, quantity, unit, weight_kg, volume_m3)
SELECT s.id, p.id, p.name, 12, 'slab', 18000, 32
FROM public.stone_shipments s
JOIN public.stone_projects p ON p.name ILIKE '%KL Sentral%'
WHERE s.destination_port = 'Port Klang';

INSERT INTO public.stone_shipment_items (shipment_id, project_id, description, quantity, unit, weight_kg, volume_m3)
SELECT s.id, p.id, p.name, 20, 'crate', 26500, 67
FROM public.stone_shipments s
JOIN public.stone_projects p ON p.name ILIKE '%Singapore Boutique%'
WHERE s.destination_port = 'Singapore';

-- Seed a few tracking events
INSERT INTO public.stone_shipment_events (shipment_id, event_type, location, message, occurred_at)
SELECT id, 'booked', origin_port, 'Booking confirmed with carrier', created_at FROM public.stone_shipments WHERE status IN ('in_transit', 'arrived', 'delivered');
INSERT INTO public.stone_shipment_events (shipment_id, event_type, location, message, occurred_at)
SELECT id, 'loaded', origin_port, 'Container loaded and sealed', actual_departure - INTERVAL '1 day' FROM public.stone_shipments WHERE actual_departure IS NOT NULL;
INSERT INTO public.stone_shipment_events (shipment_id, event_type, location, message, occurred_at)
SELECT id, 'departed', origin_port, 'Vessel departed origin port', actual_departure FROM public.stone_shipments WHERE actual_departure IS NOT NULL;
INSERT INTO public.stone_shipment_events (shipment_id, event_type, location, message, occurred_at)
SELECT id, 'arrived', destination_port, 'Vessel arrived at destination port', actual_arrival FROM public.stone_shipments WHERE actual_arrival IS NOT NULL;
INSERT INTO public.stone_shipment_events (shipment_id, event_type, location, message, occurred_at)
SELECT id, 'delivered', destination_port, 'Delivered to consignee', actual_arrival + INTERVAL '2 days' FROM public.stone_shipments WHERE status = 'delivered';
