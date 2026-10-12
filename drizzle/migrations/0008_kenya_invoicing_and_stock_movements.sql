ALTER TABLE public.erp_document_items ADD COLUMN stock_item text;

CREATE TABLE public.erp_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.erp_companies(id),
  warehouse_id uuid NOT NULL REFERENCES public.stone_warehouses(id),
  kind text NOT NULL CHECK (kind IN ('receipt','transfer','adjustment','sale')),
  item text NOT NULL CHECK (length(trim(item)) BETWEEN 1 AND 200),
  unit text NOT NULL DEFAULT 'Sqm',
  quantity numeric(14,3) NOT NULL CHECK (quantity <> 0),
  unit_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  value numeric(14,2) NOT NULL DEFAULT 0,
  from_bin text, to_bin text,
  reference text, reason text,
  document_id uuid REFERENCES public.erp_documents(id),
  movement_date date NOT NULL DEFAULT current_date,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, company_id)
);
CREATE INDEX erp_stock_movements_company_item_idx ON public.erp_stock_movements(company_id, item);
GRANT SELECT ON public.erp_stock_movements TO authenticated;
GRANT ALL ON public.erp_stock_movements TO service_role;
ALTER TABLE public.erp_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY erp_stock_read ON public.erp_stock_movements FOR SELECT TO authenticated USING (public.erp_access(company_id));
CREATE TRIGGER erp_stock_immutable BEFORE UPDATE OR DELETE ON public.erp_stock_movements FOR EACH ROW EXECUTE FUNCTION public.erp_immutable();

ALTER TABLE public.erp_journals ADD COLUMN source_stock_movement_id uuid UNIQUE REFERENCES public.erp_stock_movements(id);
ALTER TABLE public.erp_journals DROP CONSTRAINT erp_journal_source_required;
ALTER TABLE public.erp_journals ADD CONSTRAINT erp_journal_source_required CHECK ((source_document_id IS NOT NULL)::int + (source_payment_id IS NOT NULL)::int + (source_stock_movement_id IS NOT NULL)::int = 1);

CREATE OR REPLACE FUNCTION public.erp_stock_post(p_company uuid, p_movement uuid, p_debit text, p_credit text, p_amount numeric, p_label text, p_date date) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j uuid; BEGIN
  IF p_amount <= 0 THEN RETURN NULL; END IF;
  INSERT INTO public.erp_journals(company_id, source_stock_movement_id, description, journal_date) VALUES (p_company, p_movement, p_label, p_date) RETURNING id INTO j;
  INSERT INTO public.erp_journal_lines(company_id, journal_id, account_id, debit, credit)
    SELECT p_company, j, id, CASE WHEN code=p_debit THEN p_amount ELSE 0 END, CASE WHEN code=p_credit THEN p_amount ELSE 0 END
    FROM public.erp_accounts WHERE company_id=p_company AND code IN (p_debit, p_credit);
  RETURN j;
END $$;
REVOKE ALL ON FUNCTION public.erp_stock_post(uuid,uuid,text,text,numeric,text,date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.erp_stock_balance(p_company uuid, p_item text, OUT qty numeric, OUT avg_cost numeric) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT coalesce(sum(quantity),0), CASE WHEN coalesce(sum(quantity),0) > 0 THEN round(greatest(sum(value),0)/sum(quantity),2) ELSE 0 END
  FROM public.erp_stock_movements WHERE company_id=p_company AND lower(item)=lower(trim(p_item)) AND kind <> 'transfer'
$$;
REVOKE ALL ON FUNCTION public.erp_stock_balance(uuid,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.erp_record_stock_movement(p_company uuid, p_kind text, p_item text, p_unit text, p_quantity numeric, p_unit_cost numeric, p_from text, p_to text, p_reference text, p_reason text, p_date date) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE wh uuid; m uuid; bal record; val numeric; cost numeric; BEGIN
  IF NOT public.erp_access(p_company, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  SELECT warehouse_id INTO wh FROM public.erp_companies WHERE id=p_company;
  IF wh IS NULL THEN RAISE EXCEPTION 'Company warehouse required'; END IF;
  IF p_kind NOT IN ('receipt','transfer','adjustment') THEN RAISE EXCEPTION 'Invalid movement type'; END IF;
  IF p_quantity IS NULL OR p_quantity = 0 OR (p_kind <> 'adjustment' AND p_quantity < 0) THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  IF length(trim(coalesce(p_item,''))) = 0 THEN RAISE EXCEPTION 'Stock item required'; END IF;
  PERFORM public.erp_initialize(p_company);
  PERFORM pg_advisory_xact_lock(hashtextextended(p_company::text || lower(trim(p_item)), 1));
  SELECT * INTO bal FROM public.erp_stock_balance(p_company, p_item);
  IF p_kind = 'receipt' THEN
    IF p_unit_cost IS NULL OR p_unit_cost < 0 THEN RAISE EXCEPTION 'Unit cost required'; END IF;
    cost := round(p_unit_cost,2); val := round(p_quantity*cost,2);
  ELSIF p_kind = 'transfer' THEN
    IF length(trim(coalesce(p_from,''))) = 0 OR length(trim(coalesce(p_to,''))) = 0 OR trim(p_from) = trim(p_to) THEN RAISE EXCEPTION 'Different source and destination bins required'; END IF;
    IF bal.qty < p_quantity THEN RAISE EXCEPTION 'Insufficient stock: % available', bal.qty; END IF;
    cost := bal.avg_cost; val := 0;
  ELSE
    IF length(trim(coalesce(p_reason,''))) = 0 THEN RAISE EXCEPTION 'Adjustment reason required'; END IF;
    IF bal.qty + p_quantity < 0 THEN RAISE EXCEPTION 'Adjustment would make stock negative: % available', bal.qty; END IF;
    cost := CASE WHEN p_quantity > 0 AND bal.avg_cost = 0 THEN round(coalesce(p_unit_cost,0),2) ELSE bal.avg_cost END;
    val := round(p_quantity*cost,2);
  END IF;
  INSERT INTO public.erp_stock_movements(company_id, warehouse_id, kind, item, unit, quantity, unit_cost, value, from_bin, to_bin, reference, reason, movement_date)
  VALUES (p_company, wh, p_kind, trim(p_item), coalesce(nullif(trim(p_unit),''),'Sqm'), p_quantity, cost, val, nullif(trim(p_from),''), nullif(trim(p_to),''), nullif(trim(p_reference),''), nullif(trim(p_reason),''), coalesce(p_date, current_date)) RETURNING id INTO m;
  IF p_kind = 'receipt' THEN PERFORM public.erp_stock_post(p_company, m, '1200', '2000', val, 'Stock received: '||trim(p_item), coalesce(p_date,current_date));
  ELSIF p_kind = 'adjustment' AND val > 0 THEN PERFORM public.erp_stock_post(p_company, m, '1200', '5000', val, 'Stock adjustment (+): '||trim(p_item), coalesce(p_date,current_date));
  ELSIF p_kind = 'adjustment' AND val < 0 THEN PERFORM public.erp_stock_post(p_company, m, '5000', '1200', -val, 'Stock adjustment (-): '||trim(p_item), coalesce(p_date,current_date));
  END IF;
  INSERT INTO public.erp_audit_events(company_id, action, record_id, detail) VALUES (p_company, 'stock_'||p_kind, m, jsonb_build_object('item', trim(p_item), 'quantity', p_quantity, 'value', val));
  RETURN m;
END $$;
REVOKE ALL ON FUNCTION public.erp_record_stock_movement(uuid,text,text,text,numeric,numeric,text,text,text,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_record_stock_movement(uuid,text,text,text,numeric,numeric,text,text,text,text,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.erp_create_invoice(p_company uuid, p_party uuid, p_date date, p_due date, p_notes text, p_items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE doc uuid; item jsonb; idx int := 0; BEGIN
  IF NOT public.erp_access(p_company, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF p_due < p_date THEN RAISE EXCEPTION 'Due date cannot be before invoice date'; END IF;
  PERFORM public.erp_initialize(p_company);
  doc := public.erp_create_document(p_company, 'invoice', p_party, p_date, p_due, 'KES', 1, NULL, p_notes, p_items);
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF length(trim(coalesce(item->>'stock_item',''))) > 0 THEN
      UPDATE public.erp_document_items SET stock_item = trim(item->>'stock_item')
      WHERE id = (SELECT id FROM public.erp_document_items WHERE document_id = doc AND stock_item IS NULL AND description = item->>'description' AND quantity = (item->>'quantity')::numeric LIMIT 1);
    END IF;
  END LOOP;
  RETURN doc;
END $$;
REVOKE ALL ON FUNCTION public.erp_create_invoice(uuid,uuid,date,date,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_create_invoice(uuid,uuid,date,date,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.erp_post_invoice(p_document uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.erp_documents; j uuid; it record; bal record; m uuid; val numeric; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id = p_document FOR UPDATE;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF d.kind <> 'invoice' THEN RAISE EXCEPTION 'Only invoices can be posted here'; END IF;
  FOR it IN SELECT stock_item, unit, sum(quantity) q FROM public.erp_document_items WHERE document_id = d.id AND stock_item IS NOT NULL GROUP BY stock_item, unit LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(d.company_id::text || lower(it.stock_item), 1));
    SELECT * INTO bal FROM public.erp_stock_balance(d.company_id, it.stock_item);
    IF bal.qty < it.q THEN RAISE EXCEPTION 'Insufficient stock for %: % available', it.stock_item, bal.qty; END IF;
  END LOOP;
  j := public.erp_post_document(p_document, NULL);
  FOR it IN SELECT stock_item, unit, sum(quantity) q FROM public.erp_document_items WHERE document_id = d.id AND stock_item IS NOT NULL GROUP BY stock_item, unit LOOP
    SELECT * INTO bal FROM public.erp_stock_balance(d.company_id, it.stock_item);
    val := round(it.q * bal.avg_cost, 2);
    INSERT INTO public.erp_stock_movements(company_id, warehouse_id, kind, item, unit, quantity, unit_cost, value, reference, document_id, movement_date)
    SELECT d.company_id, c.warehouse_id, 'sale', it.stock_item, it.unit, -it.q, bal.avg_cost, -val, d.number, d.id, d.document_date FROM public.erp_companies c WHERE c.id = d.company_id RETURNING id INTO m;
    PERFORM public.erp_stock_post(d.company_id, m, '5000', '1200', val, 'Cost of sale '||d.number||': '||it.stock_item, d.document_date);
    INSERT INTO public.erp_audit_events(company_id, action, record_id, detail) VALUES (d.company_id, 'stock_sale', m, jsonb_build_object('invoice', d.number, 'item', it.stock_item, 'quantity', it.q, 'cost', val));
  END LOOP;
  RETURN j;
END $$;
REVOKE ALL ON FUNCTION public.erp_post_invoice(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_post_invoice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.erp_record_payment(uuid,uuid,numeric,date,text) TO authenticated;
COMMENT ON FUNCTION public.erp_post_document(uuid,uuid) IS 'Internal posting engine; applications post invoices through erp_post_invoice which also issues stock at average cost.';