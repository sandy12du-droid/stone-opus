-- ============================================================
-- Arquane OS — Inventory Intelligence schema + seed
-- ============================================================

-- Enums
CREATE TYPE public.slab_status AS ENUM ('available', 'reserved', 'sold', 'damaged', 'incoming');

-- ------------------------------------------------------------
-- 1. Warehouses
-- ------------------------------------------------------------
CREATE TABLE public.stone_warehouses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  city        text NOT NULL,
  country     text NOT NULL,
  country_flag text NOT NULL DEFAULT '🏳️',
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stone_warehouses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_warehouses TO authenticated;
GRANT ALL ON public.stone_warehouses TO service_role;
ALTER TABLE public.stone_warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Warehouses are publicly readable" ON public.stone_warehouses FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage warehouses" ON public.stone_warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. Collections
-- ------------------------------------------------------------
CREATE TABLE public.stone_collections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL UNIQUE,
  material        text NOT NULL,
  origin_country  text NOT NULL,
  origin_flag     text NOT NULL DEFAULT '🏳️',
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stone_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_collections TO authenticated;
GRANT ALL ON public.stone_collections TO service_role;
ALTER TABLE public.stone_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collections are publicly readable" ON public.stone_collections FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage collections" ON public.stone_collections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. Products (a stone SKU: color × thickness × finish)
-- ------------------------------------------------------------
CREATE TABLE public.stone_products (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                text NOT NULL UNIQUE,
  name               text NOT NULL,
  collection_id      uuid NOT NULL REFERENCES public.stone_collections(id) ON DELETE RESTRICT,
  color_family       text NOT NULL,
  thickness_mm       int  NOT NULL,
  finish             text NOT NULL,
  price_group        text NOT NULL,
  list_price_per_m2  numeric(10,2) NOT NULL,
  cost_price_per_m2  numeric(10,2),
  hero_gradient      text NOT NULL,
  image_url          text,
  bookmatch_urls     text[] NOT NULL DEFAULT '{}',
  application_urls   text[] NOT NULL DEFAULT '{}',
  tech_specs         jsonb  NOT NULL DEFAULT '{}'::jsonb,
  description        text,
  tags               text[] NOT NULL DEFAULT '{}',
  is_new_arrival     boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stone_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_products TO authenticated;
GRANT ALL ON public.stone_products TO service_role;
ALTER TABLE public.stone_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.stone_products FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage products" ON public.stone_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX stone_products_collection_idx ON public.stone_products(collection_id);
CREATE INDEX stone_products_search_idx ON public.stone_products USING gin (to_tsvector('simple', name || ' ' || sku || ' ' || color_family || ' ' || finish));

-- ------------------------------------------------------------
-- 4. Slabs (individual inventory unit)
-- ------------------------------------------------------------
CREATE TABLE public.stone_slabs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES public.stone_products(id) ON DELETE CASCADE,
  warehouse_id   uuid NOT NULL REFERENCES public.stone_warehouses(id) ON DELETE RESTRICT,
  slab_number    text NOT NULL,
  bin_location   text,
  length_cm      int NOT NULL,
  width_cm       int NOT NULL,
  area_m2        numeric(8,2) GENERATED ALWAYS AS (length_cm * width_cm / 10000.0) STORED,
  status         public.slab_status NOT NULL DEFAULT 'available',
  reserved_for   text,
  reserved_until date,
  received_at    date NOT NULL DEFAULT current_date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, slab_number)
);
GRANT SELECT ON public.stone_slabs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stone_slabs TO authenticated;
GRANT ALL ON public.stone_slabs TO service_role;
ALTER TABLE public.stone_slabs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slabs are publicly readable" ON public.stone_slabs FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage slabs" ON public.stone_slabs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX stone_slabs_product_idx   ON public.stone_slabs(product_id);
CREATE INDEX stone_slabs_warehouse_idx ON public.stone_slabs(warehouse_id);
CREATE INDEX stone_slabs_status_idx    ON public.stone_slabs(status);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arquane_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stone_products_touch_updated_at
BEFORE UPDATE ON public.stone_products
FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

CREATE TRIGGER stone_slabs_touch_updated_at
BEFORE UPDATE ON public.stone_slabs
FOR EACH ROW EXECUTE FUNCTION public.arquane_touch_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Warehouses
INSERT INTO public.stone_warehouses (code, name, city, country, country_flag) VALUES
  ('WH-LIV', 'Livorno Port Warehouse',      'Livorno',  'Italy',        '🇮🇹'),
  ('WH-NWK', 'Newark Distribution Center',  'Newark',   'United States','🇺🇸'),
  ('WH-CHN', 'Chennai Coastal Hub',         'Chennai',  'India',        '🇮🇳'),
  ('WH-JBA', 'Jebel Ali Freezone',          'Dubai',    'UAE',          '🇦🇪');

-- Collections
INSERT INTO public.stone_collections (name, material, origin_country, origin_flag, description) VALUES
  ('Calacatta Reserve',   'Marble',     'Italy',  '🇮🇹', 'Signature white marble with dramatic gold veining from Carrara.'),
  ('Statuario Extra',     'Marble',     'Italy',  '🇮🇹', 'Museum-grade white marble with fine grey veining.'),
  ('Nero Marquina',       'Marble',     'Spain',  '🇪🇸', 'Deep black marble with crisp white veining from Basque Country.'),
  ('Absolute Black',      'Granite',    'India',  '🇮🇳', 'Uniform jet-black granite prized for consistency and density.'),
  ('Taj Mahal Quartzite', 'Quartzite',  'Brazil', '🇧🇷', 'Warm cream-beige natural quartzite with subtle movement.'),
  ('Bianco Cristallo',    'Quartz',     'China',  '🇨🇳', 'Engineered pure white quartz with mirror-flake shimmer.');

-- Products
WITH c AS (SELECT id, name FROM public.stone_collections)
INSERT INTO public.stone_products
  (sku, name, collection_id, color_family, thickness_mm, finish, price_group, list_price_per_m2, cost_price_per_m2, hero_gradient, tech_specs, description, tags, is_new_arrival)
VALUES
  ('CAL-ORO-20P', 'Calacatta Oro Extra — 20mm Polished', (SELECT id FROM c WHERE name='Calacatta Reserve'), 'White & Gold', 20, 'Polished',  'Exclusive', 480, 260,
    'linear-gradient(135deg,#f6f2e8 0%,#ecdfc0 45%,#c9a55a 100%)',
    '{"density_kg_m3":2700,"water_absorption_pct":0.12,"flexural_strength_mpa":15.4,"finish_notes":"Mirror polish, book-matched pairs available"}',
    'Signature Calacatta with dramatic gold veining. Ideal for hero surfaces — feature walls, island tops, luxury lobbies.',
    ARRAY['Book-match','Luxury','Hero surface'], true),
  ('CAL-ORO-30H', 'Calacatta Oro Extra — 30mm Honed',    (SELECT id FROM c WHERE name='Calacatta Reserve'), 'White & Gold', 30, 'Honed',     'Exclusive', 520, 280,
    'linear-gradient(135deg,#efe9dc 0%,#e0d0aa 50%,#b89148 100%)',
    '{"density_kg_m3":2700,"water_absorption_pct":0.12,"flexural_strength_mpa":15.4,"finish_notes":"Soft matte, low reflectivity"}',
    'Honed variant for contemporary interiors. Softer hand-feel, matte finish, ideal for flooring and vanity tops.',
    ARRAY['Book-match','Matte','Luxury'], false),
  ('CAL-VIO-20P', 'Calacatta Viola — 20mm Polished',     (SELECT id FROM c WHERE name='Calacatta Reserve'), 'White & Violet', 20, 'Polished','Exclusive', 610, 340,
    'linear-gradient(135deg,#e3d6d0 0%,#b17e79 50%,#4c2b2e 100%)',
    '{"density_kg_m3":2720,"water_absorption_pct":0.14,"flexural_strength_mpa":14.2,"finish_notes":"Bold violet veining, book-match essential"}',
    'Rare Calacatta variant with striking violet-burgundy veining. Statement material for hospitality and residential feature walls.',
    ARRAY['Book-match','Rare','Statement'], true),
  ('STA-VEN-20P', 'Statuario Venato — 20mm Polished',    (SELECT id FROM c WHERE name='Statuario Extra'),   'White & Grey',  20, 'Polished',  'A', 420, 220,
    'linear-gradient(135deg,#f2eee7 0%,#d5ccbc 55%,#a89880 100%)',
    '{"density_kg_m3":2680,"water_absorption_pct":0.15,"flexural_strength_mpa":14.8}',
    'Classic Statuario with linear grey veining. The industry-standard luxury white marble.', ARRAY['Book-match','Classic'], false),
  ('STA-EXT-30P', 'Statuario Extra — 30mm Polished',     (SELECT id FROM c WHERE name='Statuario Extra'),   'White & Grey',  30, 'Polished',  'Exclusive', 560, 300,
    'linear-gradient(135deg,#f3efe9 0%,#dcd2c1 60%,#9c8b71 100%)',
    '{"density_kg_m3":2680,"water_absorption_pct":0.15,"flexural_strength_mpa":14.8,"finish_notes":"Extra selection, minimal veining"}',
    'Extra-select premium grade. Fewer veins, brighter white ground, best-in-class polish.', ARRAY['Premium','Book-match'], false),
  ('STA-VEN-30H', 'Statuario Venato — 30mm Honed',       (SELECT id FROM c WHERE name='Statuario Extra'),   'White & Grey',  30, 'Honed',     'A', 460, 240,
    'linear-gradient(135deg,#ece7dd 0%,#cec3af 60%,#9a8b72 100%)',
    '{"density_kg_m3":2680,"water_absorption_pct":0.15}',
    'Honed thick-slab Statuario for high-traffic floors and monolithic islands.', ARRAY['Matte','Heavy-duty'], false),
  ('NER-MAR-20P', 'Nero Marquina — 20mm Polished',       (SELECT id FROM c WHERE name='Nero Marquina'),     'Black',         20, 'Polished',  'A', 340, 170,
    'linear-gradient(135deg,#1a1a1a 0%,#2b2b2b 50%,#4a4a4a 100%)',
    '{"density_kg_m3":2730,"water_absorption_pct":0.10,"flexural_strength_mpa":16.1}',
    'Deep black marble with sharp white veining. Timeless contrast piece.', ARRAY['High-contrast','Classic'], false),
  ('NER-MAR-20H', 'Nero Marquina — 20mm Honed',          (SELECT id FROM c WHERE name='Nero Marquina'),     'Black',         20, 'Honed',     'A', 360, 175,
    'linear-gradient(135deg,#151515 0%,#252525 50%,#3a3a3a 100%)',
    '{"density_kg_m3":2730,"water_absorption_pct":0.10}',
    'Matte finish for architectural cladding and monochrome interiors.', ARRAY['Matte','Cladding'], false),
  ('ABS-BLK-20P', 'Absolute Black Premium — 20mm Polished', (SELECT id FROM c WHERE name='Absolute Black'), 'Black',         20, 'Polished',  'B', 260, 130,
    'linear-gradient(135deg,#0a0a0a 0%,#181818 60%,#242424 100%)',
    '{"density_kg_m3":3050,"water_absorption_pct":0.04,"flexural_strength_mpa":22.5,"finish_notes":"Uniform pure black, no veining"}',
    'Dense uniform black granite. Zero veining, maximum durability. Kitchen and commercial workhorse.', ARRAY['Uniform','Commercial'], false),
  ('ABS-BLK-30L', 'Absolute Black Premium — 30mm Leathered', (SELECT id FROM c WHERE name='Absolute Black'), 'Black',        30, 'Leathered', 'B', 290, 145,
    'linear-gradient(135deg,#0c0c0c 0%,#1a1a1a 60%,#2a2a2a 100%)',
    '{"density_kg_m3":3050,"water_absorption_pct":0.04,"finish_notes":"Leathered texture — anti-fingerprint"}',
    'Leathered surface for a rich matte texture. Hides fingerprints; premium residential kitchens.', ARRAY['Textured','Kitchen'], true),
  ('TAJ-CLS-20P', 'Taj Mahal Classic — 20mm Polished',   (SELECT id FROM c WHERE name='Taj Mahal Quartzite'), 'Beige',        20, 'Polished',  'A', 380, 200,
    'linear-gradient(135deg,#eee3cf 0%,#dcc9a4 60%,#b89b6d 100%)',
    '{"density_kg_m3":2650,"water_absorption_pct":0.20,"flexural_strength_mpa":13.9,"finish_notes":"Warm cream ground, soft grey movement"}',
    'Warm cream quartzite — harder and more stain-resistant than marble, with a similarly elegant look.', ARRAY['Warm','Durable'], false),
  ('TAJ-CLS-30B', 'Taj Mahal Classic — 30mm Brushed',    (SELECT id FROM c WHERE name='Taj Mahal Quartzite'), 'Beige',        30, 'Brushed',   'A', 410, 220,
    'linear-gradient(135deg,#ecdfc7 0%,#d5bf95 60%,#a88a5c 100%)',
    '{"density_kg_m3":2650,"water_absorption_pct":0.20}',
    'Brushed finish adds tactile depth for outdoor terraces and pool surrounds.', ARRAY['Outdoor','Textured'], false),
  ('BIA-CRI-20P', 'Bianco Cristallo Pure — 20mm Polished',(SELECT id FROM c WHERE name='Bianco Cristallo'), 'Pure White',   20, 'Polished',  'C', 210, 105,
    'linear-gradient(135deg,#fbfbf7 0%,#f0f0ec 60%,#dcdcd6 100%)',
    '{"density_kg_m3":2400,"water_absorption_pct":0.02,"flexural_strength_mpa":45.0,"finish_notes":"Engineered quartz — non-porous"}',
    'Engineered quartz — pure white, uniform, non-porous. High-volume kitchen and hospitality standard.', ARRAY['Engineered','High-volume'], false),
  ('BIA-CRI-30P', 'Bianco Cristallo Pure — 30mm Polished',(SELECT id FROM c WHERE name='Bianco Cristallo'), 'Pure White',   30, 'Polished',  'C', 245, 120,
    'linear-gradient(135deg,#fdfdfa 0%,#f4f4f0 60%,#e0e0da 100%)',
    '{"density_kg_m3":2400,"water_absorption_pct":0.02}',
    'Thick engineered slab for monolithic vanity tops and island benches.', ARRAY['Engineered','Monolithic'], true);

-- Slabs — distribute across warehouses with mixed statuses
WITH p AS (SELECT id, sku FROM public.stone_products),
     w AS (SELECT id, code FROM public.stone_warehouses)
INSERT INTO public.stone_slabs
  (product_id, warehouse_id, slab_number, bin_location, length_cm, width_cm, status, reserved_for, reserved_until, received_at) VALUES
  -- Calacatta Oro 20mm Polished (WH-LIV heavy stock)
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-ORO-2001','A-12-01',320,180,'available',NULL,NULL,'2026-09-04'),
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-ORO-2002','A-12-02',320,180,'available',NULL,NULL,'2026-09-04'),
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-ORO-2003','A-12-03',315,175,'reserved','Meridian Contracts Pte','2026-12-15','2026-09-04'),
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-ORO-2004','A-12-04',315,175,'reserved','Meridian Contracts Pte','2026-12-15','2026-09-04'),
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-ORO-2005','B-04-11',310,170,'available',NULL,NULL,'2026-10-12'),
  -- Calacatta Oro 30mm Honed (low stock)
  ((SELECT id FROM p WHERE sku='CAL-ORO-30H'),(SELECT id FROM w WHERE code='WH-LIV'),'S-ORO-3001','A-13-01',320,180,'available',NULL,NULL,'2026-08-20'),
  ((SELECT id FROM p WHERE sku='CAL-ORO-30H'),(SELECT id FROM w WHERE code='WH-JBA'),'S-ORO-3002','C-01-05',320,180,'available',NULL,NULL,'2026-09-11'),
  -- Calacatta Viola (very limited, hot)
  ((SELECT id FROM p WHERE sku='CAL-VIO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-VIO-2001','A-15-01',300,170,'reserved','Qatar Stone Group','2027-01-20','2026-10-01'),
  ((SELECT id FROM p WHERE sku='CAL-VIO-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-VIO-2002','A-15-02',300,170,'available',NULL,NULL,'2026-10-01'),
  -- Statuario Venato 20mm P (well stocked)
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-STA-2001','A-08-01',330,190,'available',NULL,NULL,'2026-07-15'),
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-STA-2002','A-08-02',330,190,'available',NULL,NULL,'2026-07-15'),
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-STA-2003','A-08-03',325,185,'available',NULL,NULL,'2026-07-15'),
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-STA-2004','B-05-02',325,185,'available',NULL,NULL,'2026-08-22'),
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-STA-2005','B-05-03',325,185,'reserved','Northline Interiors LLC','2026-11-30','2026-08-22'),
  ((SELECT id FROM p WHERE sku='STA-VEN-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-STA-2006','C-02-01',325,185,'available',NULL,NULL,'2026-09-30'),
  -- Statuario Extra 30mm (premium)
  ((SELECT id FROM p WHERE sku='STA-EXT-30P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-STE-3001','A-09-01',320,180,'available',NULL,NULL,'2026-08-05'),
  ((SELECT id FROM p WHERE sku='STA-EXT-30P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-STE-3002','A-09-02',320,180,'available',NULL,NULL,'2026-08-05'),
  -- Statuario Venato 30mm Honed (low)
  ((SELECT id FROM p WHERE sku='STA-VEN-30H'),(SELECT id FROM w WHERE code='WH-CHN'),'S-STH-3001','D-01-04',320,180,'available',NULL,NULL,'2026-09-18'),
  -- Nero Marquina 20mm Polished (well stocked)
  ((SELECT id FROM p WHERE sku='NER-MAR-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-NER-2001','A-20-01',300,180,'available',NULL,NULL,'2026-06-10'),
  ((SELECT id FROM p WHERE sku='NER-MAR-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-NER-2002','A-20-02',300,180,'available',NULL,NULL,'2026-06-10'),
  ((SELECT id FROM p WHERE sku='NER-MAR-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-NER-2003','B-08-01',310,180,'available',NULL,NULL,'2026-07-22'),
  ((SELECT id FROM p WHERE sku='NER-MAR-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-NER-2004','C-03-01',300,180,'reserved','Al Faraj Design House','2026-12-10','2026-08-12'),
  -- Nero Marquina Honed
  ((SELECT id FROM p WHERE sku='NER-MAR-20H'),(SELECT id FROM w WHERE code='WH-LIV'),'S-NEH-2001','A-21-01',300,180,'available',NULL,NULL,'2026-07-01'),
  ((SELECT id FROM p WHERE sku='NER-MAR-20H'),(SELECT id FROM w WHERE code='WH-JBA'),'S-NEH-2002','C-03-05',300,180,'available',NULL,NULL,'2026-09-14'),
  -- Absolute Black 20mm (high volume workhorse)
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABS-2001','D-04-01',320,190,'available',NULL,NULL,'2026-08-01'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABS-2002','D-04-02',320,190,'available',NULL,NULL,'2026-08-01'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABS-2003','D-04-03',320,190,'available',NULL,NULL,'2026-08-01'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABS-2004','D-04-04',320,190,'reserved','Ashra Developers','2026-11-30','2026-08-01'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-ABS-2005','B-11-01',320,190,'available',NULL,NULL,'2026-09-05'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-ABS-2006','B-11-02',320,190,'available',NULL,NULL,'2026-09-05'),
  -- Absolute Black 30mm Leathered (new arrival)
  ((SELECT id FROM p WHERE sku='ABS-BLK-30L'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABL-3001','D-05-01',320,190,'available',NULL,NULL,'2026-11-01'),
  ((SELECT id FROM p WHERE sku='ABS-BLK-30L'),(SELECT id FROM w WHERE code='WH-CHN'),'S-ABL-3002','D-05-02',320,190,'available',NULL,NULL,'2026-11-01'),
  -- Taj Mahal Classic 20mm
  ((SELECT id FROM p WHERE sku='TAJ-CLS-20P'),(SELECT id FROM w WHERE code='WH-LIV'),'S-TAJ-2001','A-30-01',320,180,'available',NULL,NULL,'2026-07-20'),
  ((SELECT id FROM p WHERE sku='TAJ-CLS-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-TAJ-2002','B-15-01',320,180,'available',NULL,NULL,'2026-08-15'),
  ((SELECT id FROM p WHERE sku='TAJ-CLS-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-TAJ-2003','C-05-01',320,180,'available',NULL,NULL,'2026-09-01'),
  -- Taj Mahal 30mm Brushed (low)
  ((SELECT id FROM p WHERE sku='TAJ-CLS-30B'),(SELECT id FROM w WHERE code='WH-LIV'),'S-TAB-3001','A-31-01',320,180,'available',NULL,NULL,'2026-08-10'),
  -- Bianco Cristallo 20mm (engineered, high stock)
  ((SELECT id FROM p WHERE sku='BIA-CRI-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-BIA-2001','B-20-01',320,160,'available',NULL,NULL,'2026-09-15'),
  ((SELECT id FROM p WHERE sku='BIA-CRI-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-BIA-2002','B-20-02',320,160,'available',NULL,NULL,'2026-09-15'),
  ((SELECT id FROM p WHERE sku='BIA-CRI-20P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-BIA-2003','B-20-03',320,160,'available',NULL,NULL,'2026-09-15'),
  ((SELECT id FROM p WHERE sku='BIA-CRI-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-BIA-2004','C-10-01',320,160,'available',NULL,NULL,'2026-10-02'),
  ((SELECT id FROM p WHERE sku='BIA-CRI-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-BIA-2005','C-10-02',320,160,'reserved','Kishimoto Interiors','2026-11-30','2026-10-02'),
  -- Bianco Cristallo 30mm (new)
  ((SELECT id FROM p WHERE sku='BIA-CRI-30P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-BIC-3001','B-21-01',320,160,'available',NULL,NULL,'2026-11-05'),
  ((SELECT id FROM p WHERE sku='BIA-CRI-30P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-BIC-3002','B-21-02',320,160,'available',NULL,NULL,'2026-11-05'),
  -- Incoming (in transit)
  ((SELECT id FROM p WHERE sku='CAL-ORO-20P'),(SELECT id FROM w WHERE code='WH-JBA'),'S-ORO-2101','C-01-01',320,180,'incoming',NULL,NULL,'2026-12-05'),
  ((SELECT id FROM p WHERE sku='STA-EXT-30P'),(SELECT id FROM w WHERE code='WH-NWK'),'S-STE-3101','B-09-01',320,180,'incoming',NULL,NULL,'2026-12-20');
