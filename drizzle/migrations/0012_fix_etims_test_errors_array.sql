CREATE OR REPLACE FUNCTION public.erp_etims_test_validate(p_document uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE d public.erp_documents; c public.erp_companies; p public.erp_parties; errs text[] := '{}'; calc numeric; sid uuid; pin text := '^[A-Z][0-9]{9}[A-Z]$'; BEGIN
  SELECT * INTO d FROM public.erp_documents WHERE id=p_document;
  IF d.id IS NULL OR NOT public.erp_access(d.company_id,true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  SELECT * INTO c FROM public.erp_companies WHERE id=d.company_id;
  IF c.etims_mode<>'test' THEN RAISE EXCEPTION 'Turn on eTIMS test mode in tax settings first'; END IF;
  IF d.kind NOT IN ('invoice','credit_note') THEN RAISE EXCEPTION 'Only invoices and credit notes are validated'; END IF;
  SELECT * INTO p FROM public.erp_parties WHERE id=d.party_id;
  IF d.status<>'posted' THEN errs := array_append(errs, 'Invoice is not posted'); END IF;
  IF coalesce(c.kra_pin,'') !~ pin THEN errs := array_append(errs, 'Company KRA PIN missing or invalid'); END IF;
  IF p.vat_registered AND coalesce(p.kra_pin,'') !~ pin THEN errs := array_append(errs, 'VAT-registered customer needs a valid KRA PIN'); END IF;
  IF d.currency<>'KES' THEN errs := array_append(errs, 'Currency must be KES'); END IF;
  SELECT coalesce(sum(net_amount+tax_amount),0) INTO calc FROM public.erp_document_items WHERE document_id=d.id;
  IF abs(calc-d.total)>0.01 THEN errs := array_append(errs, 'Line totals do not match invoice total'); END IF;
  INSERT INTO public.erp_etims_submissions(company_id,document_id,status,errors,payload)
  VALUES (d.company_id,d.id,CASE WHEN cardinality(errs)=0 THEN 'test_passed' ELSE 'test_failed' END,errs,
    jsonb_build_object('invoice',d.number,'date',d.document_date,'seller_pin',c.kra_pin,'buyer_pin',p.kra_pin,'buyer',p.name,'subtotal',d.subtotal,'vat',d.tax_amount,'total',d.total,'note','Test-mode validation only; not sent to KRA')) RETURNING id INTO sid;
  RETURN sid; END $function$;