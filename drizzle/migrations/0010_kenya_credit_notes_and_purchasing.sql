ALTER TABLE public.erp_documents ADD COLUMN original_document_id uuid REFERENCES public.erp_documents(id);
CREATE UNIQUE INDEX erp_documents_one_credit_note ON public.erp_documents(original_document_id) WHERE kind = 'credit_note';
CREATE UNIQUE INDEX erp_documents_one_bill_per_po ON public.erp_documents(original_document_id) WHERE kind = 'bill';
ALTER TABLE public.erp_stock_movements DROP CONSTRAINT erp_stock_movements_kind_check;
ALTER TABLE public.erp_stock_movements ADD CONSTRAINT erp_stock_movements_kind_check CHECK (kind IN ('receipt','transfer','adjustment','sale','return'));

CREATE OR REPLACE FUNCTION public.erp_payment_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.erp_documents; paid numeric; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=NEW.document_id FOR UPDATE;
  SELECT coalesce(sum(amount),0) INTO paid FROM public.erp_payments WHERE document_id=d.id;
  IF d.status<>'posted' OR d.kind NOT IN ('invoice','bill') OR paid>d.total THEN RAISE EXCEPTION 'Payment requires a posted invoice or bill and cannot exceed its balance'; END IF;
  IF EXISTS (SELECT 1 FROM public.erp_documents WHERE original_document_id=d.id AND kind='credit_note') THEN RAISE EXCEPTION 'This invoice was cancelled by a credit note'; END IF;
  RETURN NULL; END $$;
REVOKE ALL ON FUNCTION public.erp_payment_limit() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.erp_credit_invoice(p_invoice uuid, p_reason text, p_date date) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d public.erp_documents; cn uuid; num text; j uuid; src uuid; mv record; m uuid; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_invoice FOR UPDATE;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF d.kind<>'invoice' OR d.status<>'posted' THEN RAISE EXCEPTION 'Only posted invoices can be credited'; END IF;
  IF length(trim(coalesce(p_reason,'')))=0 THEN RAISE EXCEPTION 'Credit note reason required'; END IF;
  IF EXISTS (SELECT 1 FROM public.erp_documents WHERE original_document_id=d.id AND kind='credit_note') THEN RAISE EXCEPTION 'Invoice already credited'; END IF;
  IF EXISTS (SELECT 1 FROM public.erp_payments WHERE document_id=d.id) THEN RAISE EXCEPTION 'Invoice has payments; refunds are not supported yet'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(d.company_id::text,0));
  num := 'CRN-'||to_char(coalesce(p_date,current_date),'YYYY')||'-'||lpad((SELECT count(*)+1 FROM public.erp_documents WHERE company_id=d.company_id)::text,6,'0');
  INSERT INTO public.erp_documents(company_id,kind,number,party_id,document_date,due_date,currency,exchange_rate,notes,original_document_id,subtotal,tax_amount,total)
  VALUES (d.company_id,'credit_note',num,d.party_id,coalesce(p_date,current_date),coalesce(p_date,current_date),d.currency,d.exchange_rate,trim(p_reason),d.id,d.subtotal,d.tax_amount,d.total) RETURNING id INTO cn;
  INSERT INTO public.erp_document_items(company_id,document_id,description,quantity,unit,unit_price,discount,tax_code_id,net_amount,tax_amount,stock_item)
  SELECT company_id,cn,description,quantity,unit,unit_price,discount,tax_code_id,net_amount,tax_amount,stock_item FROM public.erp_document_items WHERE document_id=d.id;
  SELECT id INTO src FROM public.erp_journals WHERE source_document_id=d.id;
  INSERT INTO public.erp_journals(company_id,source_document_id,description,journal_date) VALUES (d.company_id,cn,'Credit note '||num||' reverses '||d.number,coalesce(p_date,current_date)) RETURNING id INTO j;
  INSERT INTO public.erp_journal_lines(company_id,journal_id,account_id,debit,credit) SELECT company_id,j,account_id,credit,debit FROM public.erp_journal_lines WHERE journal_id=src;
  FOR mv IN SELECT * FROM public.erp_stock_movements WHERE document_id=d.id AND kind='sale' LOOP
    INSERT INTO public.erp_stock_movements(company_id,warehouse_id,kind,item,unit,quantity,unit_cost,value,reference,reason,document_id,movement_date)
    VALUES (mv.company_id,mv.warehouse_id,'return',mv.item,mv.unit,-mv.quantity,mv.unit_cost,-mv.value,num,trim(p_reason),cn,coalesce(p_date,current_date)) RETURNING id INTO m;
    PERFORM public.erp_stock_post(mv.company_id,m,'1200','5000',-mv.value,'Stock returned '||num||': '||mv.item,coalesce(p_date,current_date));
  END LOOP;
  UPDATE public.erp_documents SET status='posted', posted_at=now() WHERE id=cn;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (d.company_id,'credit_note_posted',cn,jsonb_build_object('invoice',d.number,'total',d.total,'reason',trim(p_reason),'journal',j));
  RETURN cn; END $$;
REVOKE ALL ON FUNCTION public.erp_credit_invoice(uuid,text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_credit_invoice(uuid,text,date) TO authenticated;

CREATE OR REPLACE FUNCTION public.erp_create_purchase_order(p_company uuid, p_party uuid, p_date date, p_due date, p_notes text, p_items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE doc uuid; item jsonb; BEGIN
  IF NOT public.erp_access(p_company, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF p_due < p_date THEN RAISE EXCEPTION 'Expected date cannot be before order date'; END IF;
  PERFORM public.erp_initialize(p_company);
  doc := public.erp_create_document(p_company,'purchase_order',p_party,p_date,p_due,'KES',1,NULL,p_notes,p_items);
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF length(trim(coalesce(item->>'stock_item','')))>0 THEN
      UPDATE public.erp_document_items SET stock_item=trim(item->>'stock_item') WHERE id=(SELECT id FROM public.erp_document_items WHERE document_id=doc AND stock_item IS NULL AND description=item->>'description' AND quantity=(item->>'quantity')::numeric LIMIT 1);
    END IF;
  END LOOP;
  RETURN doc; END $$;
REVOKE ALL ON FUNCTION public.erp_create_purchase_order(uuid,uuid,date,date,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_create_purchase_order(uuid,uuid,date,date,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.erp_receive_purchase_order(p_po uuid, p_supplier_ref text, p_date date, p_bin text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE po public.erp_documents; bill uuid; num text; it record; wh uuid; terms int; BEGIN
  SELECT * INTO po FROM public.erp_documents WHERE id=p_po FOR UPDATE;
  IF po.id IS NULL OR NOT public.erp_access(po.company_id, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF po.kind<>'purchase_order' OR po.status<>'draft' THEN RAISE EXCEPTION 'Only open purchase orders can be received'; END IF;
  IF length(trim(coalesce(p_supplier_ref,'')))=0 THEN RAISE EXCEPTION 'Supplier invoice number required'; END IF;
  SELECT warehouse_id INTO wh FROM public.erp_companies WHERE id=po.company_id;
  SELECT payment_terms INTO terms FROM public.erp_parties WHERE id=po.party_id;
  PERFORM pg_advisory_xact_lock(hashtextextended(po.company_id::text,0));
  num := 'BIL-'||to_char(coalesce(p_date,current_date),'YYYY')||'-'||lpad((SELECT count(*)+1 FROM public.erp_documents WHERE company_id=po.company_id)::text,6,'0');
  INSERT INTO public.erp_documents(company_id,kind,number,supplier_reference,party_id,document_date,due_date,currency,exchange_rate,notes,original_document_id,subtotal,tax_amount,total)
  VALUES (po.company_id,'bill',num,trim(p_supplier_ref),po.party_id,coalesce(p_date,current_date),coalesce(p_date,current_date)+coalesce(terms,30),po.currency,po.exchange_rate,'Received from '||po.number,po.id,po.subtotal,po.tax_amount,po.total) RETURNING id INTO bill;
  INSERT INTO public.erp_document_items(company_id,document_id,description,quantity,unit,unit_price,discount,tax_code_id,net_amount,tax_amount,stock_item)
  SELECT company_id,bill,description,quantity,unit,unit_price,discount,tax_code_id,net_amount,tax_amount,stock_item FROM public.erp_document_items WHERE document_id=po.id;
  PERFORM public.erp_post_document(bill, NULL);
  FOR it IN SELECT stock_item, unit, sum(quantity) q, sum(net_amount) v FROM public.erp_document_items WHERE document_id=po.id AND stock_item IS NOT NULL GROUP BY stock_item, unit LOOP
    INSERT INTO public.erp_stock_movements(company_id,warehouse_id,kind,item,unit,quantity,unit_cost,value,to_bin,reference,document_id,movement_date)
    VALUES (po.company_id,wh,'receipt',it.stock_item,it.unit,it.q,round(it.v*po.exchange_rate/it.q,2),round(it.v*po.exchange_rate,2),nullif(trim(p_bin),''),num||' / '||trim(p_supplier_ref),bill,coalesce(p_date,current_date));
  END LOOP;
  UPDATE public.erp_documents SET status='posted', posted_at=now() WHERE id=po.id;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (po.company_id,'purchase_order_received',bill,jsonb_build_object('purchase_order',po.number,'bill',num,'supplier_reference',trim(p_supplier_ref),'total',po.total));
  RETURN bill; END $$;
REVOKE ALL ON FUNCTION public.erp_receive_purchase_order(uuid,text,date,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_receive_purchase_order(uuid,text,date,text) TO authenticated;