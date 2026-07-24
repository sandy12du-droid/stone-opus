
-- Status enum
DO $$ BEGIN
  CREATE TYPE public.quotation_status AS ENUM ('draft','in_review','sent','accepted','rejected','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Quotation number generator
CREATE SEQUENCE IF NOT EXISTS public.stone_quotation_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'AQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.stone_quotation_seq')::text, 5, '0');
$$;

-- Quotations header
CREATE TABLE IF NOT EXISTS public.stone_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE DEFAULT public.generate_quotation_number(),
  status public.quotation_status NOT NULL DEFAULT 'draft',
  customer_name text NOT NULL,
  customer_company text,
  customer_email text,
  customer_country text,
  customer_flag text NOT NULL DEFAULT '🏳️',
  project_name text,
  owner_name text NOT NULL DEFAULT 'Unassigned',
  currency text NOT NULL DEFAULT 'USD',
  incoterm text NOT NULL DEFAULT 'FOB',
  valid_until date,
  notes text,
  tax_rate numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  sent_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stone_quotations TO anon, authenticated;
GRANT ALL ON public.stone_quotations TO service_role;
ALTER TABLE public.stone_quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quotations are publicly readable" ON public.stone_quotations FOR SELECT USING (true);

CREATE TRIGGER stone_quotations_touch_updated_at
BEFORE UPDATE ON public.stone_quotations
FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

-- Quotation items
CREATE TABLE IF NOT EXISTS public.stone_quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.stone_quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.stone_products(id) ON DELETE SET NULL,
  sku text,
  description text NOT NULL,
  finish text,
  thickness_mm integer,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'm²',
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  slab_ids uuid[] NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stone_quotation_items TO anon, authenticated;
GRANT ALL ON public.stone_quotation_items TO service_role;
ALTER TABLE public.stone_quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quotation items are publicly readable" ON public.stone_quotation_items FOR SELECT USING (true);

CREATE TRIGGER stone_quotation_items_touch_updated_at
BEFORE UPDATE ON public.stone_quotation_items
FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

CREATE INDEX IF NOT EXISTS stone_quotation_items_quotation_idx ON public.stone_quotation_items(quotation_id);

-- Events / approval workflow log
CREATE TABLE IF NOT EXISTS public.stone_quotation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.stone_quotations(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  actor text NOT NULL DEFAULT 'System',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stone_quotation_events TO anon, authenticated;
GRANT ALL ON public.stone_quotation_events TO service_role;
ALTER TABLE public.stone_quotation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quotation events are publicly readable" ON public.stone_quotation_events FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS stone_quotation_events_quotation_idx ON public.stone_quotation_events(quotation_id, created_at DESC);
