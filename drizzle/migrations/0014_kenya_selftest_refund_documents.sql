CREATE OR REPLACE FUNCTION public.erp_run_selftest(p_company uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE result text;
  co uuid; wh uuid; cust uuid; tax uuid; cash uuid; mpesa uuid;
  stock_id uuid; inv uuid; pay uuid; crn uuid; refund uuid; exp uuid; so uuid; so_inv uuid;
  touched uuid[]; bad int; v_item text := 'ZZ_AUTOTEST_SLAB_' || floor(random() * 1e9)::text;
BEGIN
  IF NOT public.erp_access(p_company, true) THEN RAISE EXCEPTION 'Company accounting access required'; END IF;
  BEGIN
  SELECT c.id, c.warehouse_id INTO co, wh FROM erp_companies c WHERE c.id = p_company;
  SELECT id INTO cust FROM erp_parties WHERE company_id = co AND kind = 'customer' LIMIT 1;
  IF cust IS NULL THEN RAISE EXCEPTION 'FAIL: create at least one customer before running the self-test'; END IF;
  SELECT id INTO tax FROM erp_tax_codes WHERE company_id = co AND rate = 16 LIMIT 1;
  SELECT id INTO cash FROM erp_accounts WHERE company_id = co AND code = '1000';
  SELECT id INTO mpesa FROM erp_accounts WHERE company_id = co AND code = '1020';
  stock_id := erp_record_stock_movement(co, 'receipt', v_item, 'Sqm', 10, 5000, '', 'A1', 'AUTOTEST', '', current_date);
  PERFORM erp_record_stock_movement(co, 'adjustment', v_item, 'Sqm', -1, 5000, 'A1', '', 'AUTOTEST', 'Breakage test', current_date);
  inv := erp_create_invoice(co, cust, current_date, current_date + 30, 'autotest',
    jsonb_build_array(jsonb_build_object('description', v_item, 'stock_item', v_item, 'quantity', 2, 'unit', 'Sqm', 'unit_price', 9000, 'discount', 0, 'tax_code_id', tax)));
  PERFORM erp_post_invoice(inv);
  pay := erp_record_payment(inv, mpesa, 1000, current_date, 'AUTOTEST-PAY');
  crn := erp_credit_invoice(inv, 'autotest reversal', current_date);
  refund := erp_refund_customer(crn, cash, 1000, current_date, 'AUTOTEST-REF');
  so := erp_create_sales_order(co, cust, current_date, current_date + 7, 'autotest',
    jsonb_build_array(jsonb_build_object('description', 'Service', 'stock_item', '', 'quantity', 1, 'unit', 'Job', 'unit_price', 500, 'discount', 0, 'tax_code_id', tax)));
  so_inv := erp_convert_sales_order(so, current_date);
  exp := erp_create_expense(co, NULL, current_date, 'AUTOTEST-EXP', 'autotest',
    jsonb_build_array(jsonb_build_object('description', 'Fuel', 'stock_item', '', 'quantity', 1, 'unit', 'Each', 'unit_price', 1000, 'discount', 0, 'tax_code_id', tax)));
  PERFORM erp_post_expense(exp, cash);

  SELECT array_agg(id) INTO touched FROM erp_journals WHERE company_id = co AND (source_document_id IN (inv, crn, exp, refund) OR source_payment_id = pay OR source_stock_movement_id IN (SELECT id FROM erp_stock_movements WHERE item = v_item));
  IF coalesce(array_length(touched, 1), 0) < 7 THEN RAISE EXCEPTION 'FAIL: expected at least 7 journals (2 stock, invoice, payment, credit note, refund, expense), got %', coalesce(array_length(touched, 1), 0); END IF;
  SELECT count(*) INTO bad FROM (SELECT journal_id FROM erp_journal_lines WHERE journal_id = ANY(touched) GROUP BY journal_id HAVING sum(debit) <> sum(credit) OR sum(debit) = 0) x;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: % test journals are unbalanced', bad; END IF;
  SELECT count(*) INTO bad FROM (SELECT journal_id FROM erp_journal_lines WHERE company_id = co GROUP BY journal_id HAVING sum(debit) <> sum(credit)) x;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: company ledger has % unbalanced journals', bad; END IF;
  IF NOT EXISTS (SELECT 1 FROM erp_journals WHERE source_document_id = exp) THEN RAISE EXCEPTION 'FAIL: expense not posted'; END IF;
  IF NOT EXISTS (SELECT 1 FROM erp_journals WHERE source_document_id = refund) THEN RAISE EXCEPTION 'FAIL: refund not posted'; END IF;

  SELECT count(*) INTO bad FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv, refund) AND (company_id <> co OR currency <> 'KES');
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: documents outside the Kenya company or not in KES'; END IF;
  SELECT count(*) INTO bad FROM erp_journal_lines WHERE journal_id = ANY(touched) AND company_id <> co;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: ledger lines leaked to another company'; END IF;
  SELECT count(*) INTO bad FROM erp_stock_movements WHERE item = v_item AND (warehouse_id <> wh OR company_id <> co);
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: stock movement recorded in another location'; END IF;
  SELECT count(*) INTO bad FROM stone_quotations q WHERE q.number IN (SELECT number FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv, refund));
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: Kenya document appears in global quotations'; END IF;
  SELECT count(*) INTO bad FROM stone_shipments s WHERE s.reference IN (SELECT number FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv, refund));
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: Kenya document appears in global shipments'; END IF;

  RAISE EXCEPTION 'PASS: invoices, payments, credit notes, refunds, expenses and stock movements are balanced and Kenya-only';
  EXCEPTION WHEN others THEN result := SQLERRM;
  END;
  RETURN jsonb_build_object('passed', result LIKE 'PASS:%', 'message', result);
END $function$;