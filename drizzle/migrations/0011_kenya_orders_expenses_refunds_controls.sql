ALTER TABLE public.erp_documents DROP CONSTRAINT erp_documents_kind_check;
ALTER TABLE public.erp_documents ADD CONSTRAINT erp_documents_kind_check CHECK (kind IN ('invoice','bill','expense','sales_order','purchase_order','credit_note','refund'));
ALTER TABLE public.erp_documents ADD COLUMN approval_status text NOT NULL DEFAULT 'not_required' CHECK (approval_status IN ('not_required','pending','approved','rejected')),
  ADD COLUMN approval_requested_by uuid, ADD COLUMN approved_by uuid, ADD COLUMN approved_at timestamptz, ADD COLUMN approval_note text;
ALTER TABLE public.erp_companies ADD COLUMN etims_mode text NOT NULL DEFAULT 'disabled' CHECK (etims_mode IN ('disabled','test')),
  ADD COLUMN approval_threshold numeric NOT NULL DEFAULT 0 CHECK (approval_threshold >= 0);

CREATE TABLE public.erp_etims_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.erp_companies(id),
  document_id uuid NOT NULL REFERENCES public.erp_documents(id),
  mode text NOT NULL DEFAULT 'test' CHECK (mode = 'test'),
  status text NOT NULL CHECK (status IN ('test_passed','test_failed')),
  errors text[] NOT NULL DEFAULT '{}',
  payload jsonb NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.erp_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.erp_companies(id),
  document_id uuid NOT NULL REFERENCES public.erp_documents(id),
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  recipient text NOT NULL CHECK (length(recipient) BETWEEN 3 AND 200),
  status text NOT NULL CHECK (status IN ('opened_in_app','confirmed_sent','failed')),
  note text CHECK (length(note) <= 500),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ON public.erp_etims_submissions(document_id);
CREATE INDEX ON public.erp_communications(document_id);
GRANT SELECT ON public.erp_etims_submissions, public.erp_communications TO authenticated;
GRANT ALL ON public.erp_etims_submissions, public.erp_communications TO service_role;
ALTER TABLE public.erp_etims_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read etims" ON public.erp_etims_submissions FOR SELECT TO authenticated USING (public.erp_access(company_id, false));
CREATE POLICY "members read comms" ON public.erp_communications FOR SELECT TO authenticated USING (public.erp_access(company_id, false));
CREATE TRIGGER erp_etims_immutable BEFORE UPDATE OR DELETE ON public.erp_etims_submissions FOR EACH ROW EXECUTE FUNCTION public.erp_immutable();
CREATE TRIGGER erp_comms_immutable BEFORE UPDATE OR DELETE ON public.erp_communications FOR EACH ROW EXECUTE FUNCTION public.erp_immutable();

-- Approval gate on posting
CREATE OR REPLACE FUNCTION public.erp_approval_gate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; t numeric; BEGIN
  IF NEW.source_document_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO d FROM public.erp_documents WHERE id = NEW.source_document_id;
  SELECT approval_threshold INTO t FROM public.erp_companies WHERE id = d.company_id;
  IF d.kind IN ('invoice','expense') AND t > 0 AND d.total >= t AND d.approval_status <> 'approved' THEN
    RAISE EXCEPTION 'Approval required: % totals KSh % (threshold KSh %)', d.number, d.total, t; END IF;
  RETURN NEW; END $$;
REVOKE EXECUTE ON FUNCTION public.erp_approval_gate() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER erp_journal_approval_gate BEFORE INSERT ON public.erp_journals FOR EACH ROW EXECUTE FUNCTION public.erp_approval_gate();

CREATE OR REPLACE FUNCTION public.erp_request_approval(p_document uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id = p_document FOR UPDATE;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF d.status <> 'draft' OR d.kind NOT IN ('invoice','expense') THEN RAISE EXCEPTION 'Only draft invoices and expenses need approval'; END IF;
  IF d.approval_status IN ('pending','approved') THEN RAISE EXCEPTION 'Approval already %', d.approval_status; END IF;
  UPDATE public.erp_documents SET approval_status='pending', approval_requested_by=auth.uid(), approved_by=NULL, approved_at=NULL, approval_note=NULL WHERE id=d.id;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (d.company_id,'approval_requested',d.id,jsonb_build_object('number',d.number,'total',d.total));
END $$;
CREATE OR REPLACE FUNCTION public.erp_decide_approval(p_document uuid, p_approve boolean, p_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; r text; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id = p_document FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Document not found'; END IF;
  SELECT role INTO r FROM public.erp_memberships WHERE company_id=d.company_id AND user_id=auth.uid();
  IF r NOT IN ('owner','manager') THEN RAISE EXCEPTION 'Only owners and managers can approve'; END IF;
  IF d.approval_status <> 'pending' OR d.status <> 'draft' THEN RAISE EXCEPTION 'No pending approval'; END IF;
  IF d.approval_requested_by = auth.uid() AND r <> 'owner' THEN RAISE EXCEPTION 'You cannot approve your own request'; END IF;
  IF NOT p_approve AND length(trim(coalesce(p_note,''))) = 0 THEN RAISE EXCEPTION 'Rejection reason required'; END IF;
  UPDATE public.erp_documents SET approval_status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END, approved_by=auth.uid(), approved_at=now(), approval_note=nullif(trim(coalesce(p_note,'')),'') WHERE id=d.id;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (d.company_id, CASE WHEN p_approve THEN 'approval_granted' ELSE 'approval_rejected' END, d.id, jsonb_build_object('number',d.number,'note',p_note));
END $$;

-- Sales orders
CREATE OR REPLACE FUNCTION public.erp_create_sales_order(p_company uuid, p_party uuid, p_date date, p_due date, p_notes text, p_items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE doc uuid; item jsonb; BEGIN
  IF p_due < p_date THEN RAISE EXCEPTION 'Delivery date cannot be before order date'; END IF;
  PERFORM public.erp_initialize(p_company);
  doc := public.erp_create_document(p_company,'sales_order',p_party,p_date,p_due,'KES',1,NULL,p_notes,p_items);
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF length(trim(coalesce(item->>'stock_item',''))) > 0 THEN
      UPDATE public.erp_document_items SET stock_item=trim(item->>'stock_item') WHERE id=(SELECT id FROM public.erp_document_items WHERE document_id=doc AND stock_item IS NULL AND description=item->>'description' AND quantity=(item->>'quantity')::numeric LIMIT 1);
    END IF; END LOOP;
  RETURN doc; END $$;
CREATE OR REPLACE FUNCTION public.erp_convert_sales_order(p_order uuid, p_date date) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; terms int; inv uuid; items jsonb; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_order FOR UPDATE;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id,true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF d.kind<>'sales_order' OR d.status<>'draft' THEN RAISE EXCEPTION 'Only open sales orders can be invoiced'; END IF;
  SELECT payment_terms INTO terms FROM public.erp_parties WHERE id=d.party_id;
  SELECT jsonb_agg(jsonb_build_object('description',description,'quantity',quantity,'unit',unit,'unit_price',unit_price,'discount',discount,'tax_code_id',tax_code_id,'stock_item',coalesce(stock_item,''))) INTO items FROM public.erp_document_items WHERE document_id=d.id;
  inv := public.erp_create_invoice(d.company_id,d.party_id,p_date,p_date+coalesce(terms,30),coalesce(d.notes,'')||' (from '||d.number||')',items);
  UPDATE public.erp_documents SET original_document_id=d.id WHERE id=inv;
  UPDATE public.erp_documents SET status='posted', posted_at=now() WHERE id=d.id;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (d.company_id,'sales_order_invoiced',d.id,jsonb_build_object('order',d.number,'invoice',inv));
  RETURN inv; END $$;

-- Expenses (draft, then posted via erp_post_document)
CREATE OR REPLACE FUNCTION public.erp_create_expense(p_company uuid, p_party uuid, p_date date, p_reference text, p_notes text, p_items jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE doc uuid; BEGIN
  PERFORM public.erp_initialize(p_company);
  IF p_party IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.erp_parties WHERE id=p_party AND company_id=p_company AND kind='supplier') THEN RAISE EXCEPTION 'Select a valid supplier'; END IF;
  doc := public.erp_create_document(p_company,'expense',p_party,p_date,p_date,'KES',1,p_reference,p_notes,p_items);
  RETURN doc; END $$;
CREATE OR REPLACE FUNCTION public.erp_post_expense(p_document uuid, p_account uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_document;
  IF d.kind IS DISTINCT FROM 'expense' THEN RAISE EXCEPTION 'Not an expense'; END IF;
  RETURN public.erp_post_document(p_document, p_account); END $$;

-- Credit notes now allowed on paid invoices (refund afterwards)
CREATE OR REPLACE FUNCTION public.erp_credit_invoice(p_invoice uuid, p_reason text, p_date date) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE d public.erp_documents; cn uuid; num text; j uuid; src uuid; mv record; m uuid; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_invoice FOR UPDATE;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF d.kind<>'invoice' OR d.status<>'posted' THEN RAISE EXCEPTION 'Only posted invoices can be credited'; END IF;
  IF length(trim(coalesce(p_reason,'')))=0 THEN RAISE EXCEPTION 'Credit note reason required'; END IF;
  IF EXISTS (SELECT 1 FROM public.erp_documents WHERE original_document_id=d.id AND kind='credit_note') THEN RAISE EXCEPTION 'Invoice already credited'; END IF;
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
  RETURN cn; END $function$;

-- Customer refunds against a credit note, limited to what the customer paid
CREATE OR REPLACE FUNCTION public.erp_refund_customer(p_credit_note uuid, p_account uuid, p_amount numeric, p_date date, p_reference text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cn public.erp_documents; paid numeric; refunded numeric; acct uuid; ar uuid; doc uuid; num text; j uuid; amt numeric := round(p_amount,2); BEGIN
  SELECT * INTO cn FROM public.erp_documents WHERE id=p_credit_note FOR UPDATE;
  IF cn.id IS NULL OR NOT public.erp_access(cn.company_id,true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  IF cn.kind<>'credit_note' OR cn.status<>'posted' THEN RAISE EXCEPTION 'Refunds require a posted credit note'; END IF;
  IF amt<=0 OR length(trim(coalesce(p_reference,'')))=0 THEN RAISE EXCEPTION 'Amount and reference required'; END IF;
  SELECT coalesce(sum(amount),0) INTO paid FROM public.erp_payments WHERE document_id=cn.original_document_id;
  SELECT coalesce(sum(total),0) INTO refunded FROM public.erp_documents WHERE original_document_id=cn.id AND kind='refund';
  IF refunded+amt > least(paid, cn.total) THEN RAISE EXCEPTION 'Refund exceeds amount the customer paid (KSh % available)', least(paid,cn.total)-refunded; END IF;
  SELECT id INTO acct FROM public.erp_accounts WHERE id=p_account AND company_id=cn.company_id AND code IN ('1000','1010','1020');
  IF acct IS NULL THEN RAISE EXCEPTION 'Choose Cash, Bank or M-Pesa'; END IF;
  SELECT id INTO ar FROM public.erp_accounts WHERE company_id=cn.company_id AND code='1100';
  PERFORM pg_advisory_xact_lock(hashtextextended(cn.company_id::text,0));
  num := 'REF-'||to_char(p_date,'YYYY')||'-'||lpad((SELECT count(*)+1 FROM public.erp_documents WHERE company_id=cn.company_id)::text,6,'0');
  INSERT INTO public.erp_documents(company_id,kind,number,party_id,document_date,due_date,currency,exchange_rate,supplier_reference,notes,original_document_id,subtotal,tax_amount,total)
  VALUES (cn.company_id,'refund',num,cn.party_id,p_date,p_date,'KES',1,trim(p_reference),'Refund for '||cn.number,cn.id,amt,0,amt) RETURNING id INTO doc;
  INSERT INTO public.erp_journals(company_id,source_document_id,description,journal_date) VALUES (cn.company_id,doc,'Customer refund '||num||' for '||cn.number,p_date) RETURNING id INTO j;
  INSERT INTO public.erp_journal_lines(company_id,journal_id,account_id,debit,credit) VALUES (cn.company_id,j,ar,amt,0),(cn.company_id,j,acct,0,amt);
  UPDATE public.erp_documents SET status='posted', posted_at=now() WHERE id=doc;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (cn.company_id,'customer_refund',doc,jsonb_build_object('credit_note',cn.number,'amount',amt,'journal',j));
  RETURN doc; END $$;

-- Tax and control settings
CREATE OR REPLACE FUNCTION public.erp_save_tax_code(p_company uuid, p_id uuid, p_name text, p_rate numeric, p_treatment text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text; tid uuid; BEGIN
  SELECT role INTO r FROM public.erp_memberships WHERE company_id=p_company AND user_id=auth.uid();
  IF r NOT IN ('owner','accountant') THEN RAISE EXCEPTION 'Only owners and accountants can change tax settings'; END IF;
  IF length(trim(coalesce(p_name,''))) NOT BETWEEN 1 AND 80 OR p_rate<0 OR p_rate>100 OR p_treatment NOT IN ('standard','zero','exempt','non_vat','custom') THEN RAISE EXCEPTION 'Invalid tax code'; END IF;
  IF p_id IS NULL THEN INSERT INTO public.erp_tax_codes(company_id,name,rate,treatment) VALUES (p_company,trim(p_name),p_rate,p_treatment) RETURNING id INTO tid;
  ELSE UPDATE public.erp_tax_codes SET name=trim(p_name), rate=p_rate, treatment=p_treatment WHERE id=p_id AND company_id=p_company RETURNING id INTO tid; END IF;
  IF tid IS NULL THEN RAISE EXCEPTION 'Tax code not found'; END IF;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (p_company,'tax_code_saved',tid,jsonb_build_object('name',p_name,'rate',p_rate,'treatment',p_treatment));
  RETURN tid; END $$;
CREATE OR REPLACE FUNCTION public.erp_save_controls(p_company uuid, p_etims_mode text, p_threshold numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.erp_memberships WHERE company_id=p_company AND user_id=auth.uid() AND role='owner') THEN RAISE EXCEPTION 'Only the company owner can change controls'; END IF;
  UPDATE public.erp_companies SET etims_mode=p_etims_mode, approval_threshold=p_threshold WHERE id=p_company;
  INSERT INTO public.erp_audit_events(company_id,action,record_id,detail) VALUES (p_company,'controls_saved',p_company,jsonb_build_object('etims_mode',p_etims_mode,'approval_threshold',p_threshold));
END $$;

-- eTIMS test-mode validation (no KRA connection)
CREATE OR REPLACE FUNCTION public.erp_etims_test_validate(p_document uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; c public.erp_companies; p public.erp_parties; errs text[] := '{}'; calc numeric; sid uuid; pin text := '^[A-Z][0-9]{9}[A-Z]$'; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_document;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id,true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  SELECT * INTO c FROM public.erp_companies WHERE id=d.company_id;
  IF c.etims_mode<>'test' THEN RAISE EXCEPTION 'Turn on eTIMS test mode in tax settings first'; END IF;
  IF d.kind NOT IN ('invoice','credit_note') THEN RAISE EXCEPTION 'Only invoices and credit notes are validated'; END IF;
  SELECT * INTO p FROM public.erp_parties WHERE id=d.party_id;
  IF d.status<>'posted' THEN errs := errs || 'Invoice is not posted'; END IF;
  IF coalesce(c.kra_pin,'') !~ pin THEN errs := errs || 'Company KRA PIN missing or invalid'; END IF;
  IF p.vat_registered AND coalesce(p.kra_pin,'') !~ pin THEN errs := errs || 'VAT-registered customer needs a valid KRA PIN'; END IF;
  IF d.currency<>'KES' THEN errs := errs || 'Currency must be KES'; END IF;
  SELECT coalesce(sum(net_amount+tax_amount),0) INTO calc FROM public.erp_document_items WHERE document_id=d.id;
  IF abs(calc-d.total)>0.01 THEN errs := errs || 'Line totals do not match invoice total'; END IF;
  IF EXISTS (SELECT 1 FROM public.erp_document_items i JOIN public.erp_tax_codes t ON t.id=i.tax_code_id WHERE i.document_id=d.id AND abs(round(i.net_amount*t.rate/100,2)-i.tax_amount)>0.01) THEN errs := errs || 'VAT on a line does not match its tax code'; END IF;
  INSERT INTO public.erp_etims_submissions(company_id,document_id,status,errors,payload)
  VALUES (d.company_id,d.id,CASE WHEN cardinality(errs)=0 THEN 'test_passed' ELSE 'test_failed' END,errs,
    jsonb_build_object('invoice',d.number,'date',d.document_date,'seller_pin',c.kra_pin,'buyer_pin',p.kra_pin,'buyer',p.name,'subtotal',d.subtotal,'vat',d.tax_amount,'total',d.total,'note','Test-mode validation only; not sent to KRA')) RETURNING id INTO sid;
  RETURN sid; END $$;

CREATE OR REPLACE FUNCTION public.erp_log_communication(p_document uuid, p_channel text, p_recipient text, p_status text, p_note text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.erp_documents; cid uuid; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_document;
  IF d.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.erp_memberships WHERE company_id=d.company_id AND user_id=auth.uid() AND role IN ('owner','accountant','manager','sales')) THEN RAISE EXCEPTION 'Company access required'; END IF;
  INSERT INTO public.erp_communications(company_id,document_id,channel,recipient,status,note) VALUES (d.company_id,d.id,p_channel,trim(p_recipient),p_status,nullif(trim(coalesce(p_note,'')),'')) RETURNING id INTO cid;
  RETURN cid; END $$;

REVOKE EXECUTE ON FUNCTION public.erp_request_approval(uuid), public.erp_decide_approval(uuid,boolean,text), public.erp_create_sales_order(uuid,uuid,date,date,text,jsonb), public.erp_convert_sales_order(uuid,date), public.erp_create_expense(uuid,uuid,date,text,text,jsonb), public.erp_post_expense(uuid,uuid), public.erp_refund_customer(uuid,uuid,numeric,date,text), public.erp_save_tax_code(uuid,uuid,text,numeric,text), public.erp_save_controls(uuid,text,numeric), public.erp_etims_test_validate(uuid), public.erp_log_communication(uuid,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.erp_request_approval(uuid), public.erp_decide_approval(uuid,boolean,text), public.erp_create_sales_order(uuid,uuid,date,date,text,jsonb), public.erp_convert_sales_order(uuid,date), public.erp_create_expense(uuid,uuid,date,text,text,jsonb), public.erp_post_expense(uuid,uuid), public.erp_refund_customer(uuid,uuid,numeric,date,text), public.erp_save_tax_code(uuid,uuid,text,numeric,text), public.erp_save_controls(uuid,text,numeric), public.erp_etims_test_validate(uuid), public.erp_log_communication(uuid,text,text,text,text) TO authenticated;
