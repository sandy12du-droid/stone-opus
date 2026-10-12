ALTER TABLE public.stone_quotations ADD COLUMN IF NOT EXISTS location_code text;
ALTER TABLE public.stone_projects ADD COLUMN IF NOT EXISTS location_code text;
ALTER TABLE public.stone_shipments ADD COLUMN IF NOT EXISTS location_code text;
CREATE INDEX IF NOT EXISTS stone_quotations_location_idx ON public.stone_quotations(location_code);
CREATE INDEX IF NOT EXISTS stone_projects_location_idx ON public.stone_projects(location_code);
CREATE INDEX IF NOT EXISTS stone_shipments_location_idx ON public.stone_shipments(location_code);
COMMENT ON COLUMN public.stone_quotations.location_code IS 'Warehouse code of the owning business location; NULL = HQ';