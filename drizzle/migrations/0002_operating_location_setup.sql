ALTER TABLE public.stone_warehouses ADD COLUMN IF NOT EXISTS company_name text, ADD COLUMN IF NOT EXISTS currency_code text, ADD COLUMN IF NOT EXISTS address text, ADD COLUMN IF NOT EXISTS units_per_usd numeric;
UPDATE public.stone_warehouses SET company_name = name, currency_code = CASE country WHEN 'Kenya' THEN 'KES' WHEN 'India' THEN 'INR' ELSE 'USD' END, units_per_usd = CASE country WHEN 'Kenya' THEN 129 WHEN 'India' THEN 83 ELSE 1 END WHERE currency_code IS NULL;
ALTER TABLE public.stone_warehouses ADD CONSTRAINT stone_warehouse_currency_code_check CHECK (currency_code IS NULL OR currency_code ~ '^[A-Z]{3}$'), ADD CONSTRAINT stone_warehouse_exchange_rate_check CHECK (units_per_usd IS NULL OR units_per_usd > 0);
GRANT INSERT ON public.stone_warehouses TO authenticated;
CREATE POLICY "Admins create operating locations" ON public.stone_warehouses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.stone_products ADD COLUMN IF NOT EXISTS location_code text;
CREATE INDEX IF NOT EXISTS stone_products_location_idx ON public.stone_products(location_code);
CREATE OR REPLACE FUNCTION public.create_operating_location(p_company text, p_warehouse text, p_code text, p_city text, p_country text, p_currency text, p_address text, p_rate numeric) RETURNS public.stone_warehouses LANGUAGE plpgsql SET search_path = public AS $$
DECLARE created public.stone_warehouses;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 IF length(trim(p_company)) = 0 OR length(trim(p_warehouse)) = 0 OR length(trim(p_city)) = 0 OR length(trim(p_country)) = 0 OR p_code !~ '^[A-Z0-9-]{2,30}$' OR p_currency !~ '^[A-Z]{3}$' OR p_rate <= 0 THEN RAISE EXCEPTION 'Invalid location details'; END IF;
 IF EXISTS (SELECT 1 FROM public.stone_warehouses WHERE code = p_code) THEN RAISE EXCEPTION 'Warehouse code already exists'; END IF;
 INSERT INTO public.stone_warehouses(name, company_name, code, city, country, currency_code, address, units_per_usd, country_flag) VALUES(trim(p_warehouse), trim(p_company), p_code, trim(p_city), trim(p_country), p_currency, nullif(trim(p_address), ''), p_rate, '') RETURNING * INTO created;
 RETURN created;
END; $$;
REVOKE ALL ON FUNCTION public.create_operating_location(text,text,text,text,text,text,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_operating_location(text,text,text,text,text,text,text,numeric) TO authenticated;