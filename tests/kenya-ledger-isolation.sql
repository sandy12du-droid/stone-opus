-- Kenya ERP integration test. Runs every posting workflow as the Kenya owner
-- inside a transaction, asserts balanced ledgers and location isolation, then
-- rolls everything back so no records persist.
BEGIN;
SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT user_id FROM erp_memberships WHERE role = 'owner' LIMIT 1), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  co uuid; wh uuid; cust uuid; tax uuid; cash uuid; mpesa uuid;
  stock_id uuid; inv uuid; pay uuid; crn uuid; refund uuid; exp uuid; so uuid; so_inv uuid;
  touched uuid[]; bad int; item text := 'ZZ_AUTOTEST_SLAB_' || floor(random() * 1e9)::text;
BEGIN
  SELECT c.id, c.warehouse_id INTO co, wh FROM erp_companies c JOIN stone_warehouses w ON w.id = c.warehouse_id WHERE w.code = 'WH-NBO';
  IF co IS NULL THEN RAISE EXCEPTION 'FAIL: Kenya company not visible to owner'; END IF;
  SELECT id INTO cust FROM erp_parties WHERE company_id = co AND kind = 'customer' LIMIT 1;
  SELECT id INTO tax FROM erp_tax_codes WHERE company_id = co AND rate = 16 LIMIT 1;
  SELECT id INTO cash FROM erp_accounts WHERE company_id = co AND code = '1000';
  SELECT id INTO mpesa FROM erp_accounts WHERE company_id = co AND code = '1020';

  -- Stock receipt + adjustment
  stock_id := erp_record_stock_movement(co, 'receipt', item, 'Sqm', 10, 5000, '', 'A1', 'AUTOTEST', '', current_date);
  PERFORM erp_record_stock_movement(co, 'adjustment', item, 'Sqm', -1, 5000, 'A1', '', 'AUTOTEST', 'Breakage test', current_date);

  -- Invoice -> post -> payment -> credit note -> refund
  inv := erp_create_invoice(co, cust, current_date, current_date + 30, 'autotest',
    jsonb_build_array(jsonb_build_object('description', item, 'stock_item', item, 'quantity', 2, 'unit', 'Sqm', 'unit_price', 9000, 'discount', 0, 'tax_code_id', tax)));
  PERFORM erp_post_invoice(inv);
  pay := erp_record_payment(inv, mpesa, 1000, current_date, 'AUTOTEST-PAY');
  crn := erp_credit_invoice(inv, 'autotest reversal', current_date);
  refund := erp_refund_customer(crn, cash, 1000, current_date, 'AUTOTEST-REF');

  -- Sales order -> invoice conversion
  so := erp_create_sales_order(co, cust, current_date, current_date + 7, 'autotest',
    jsonb_build_array(jsonb_build_object('description', 'Service', 'stock_item', '', 'quantity', 1, 'unit', 'Job', 'unit_price', 500, 'discount', 0, 'tax_code_id', tax)));
  so_inv := erp_convert_sales_order(so, current_date);

  -- Expense
  exp := erp_create_expense(co, NULL, current_date, 'AUTOTEST-EXP', 'autotest',
    jsonb_build_array(jsonb_build_object('description', 'Fuel', 'stock_item', '', 'quantity', 1, 'unit', 'Each', 'unit_price', 1000, 'discount', 0, 'tax_code_id', tax)));
  PERFORM erp_post_expense(exp, cash);

  -- 1. Every journal created by these workflows exists and balances
  SELECT array_agg(id) INTO touched FROM erp_journals WHERE company_id = co AND (source_document_id IN (inv, crn, exp) OR source_payment_id IS NOT NULL AND source_payment_id IN (SELECT id FROM erp_payments WHERE reference LIKE 'AUTOTEST%') OR source_stock_movement_id IN (SELECT id FROM erp_stock_movements WHERE reference = 'AUTOTEST'));
  IF coalesce(array_length(touched, 1), 0) < 6 THEN RAISE EXCEPTION 'FAIL: expected >= 6 journals (stock x2, invoice, payment, credit, refund, expense), got %', coalesce(array_length(touched, 1), 0); END IF;
  SELECT count(*) INTO bad FROM (SELECT journal_id FROM erp_journal_lines WHERE journal_id = ANY(touched) GROUP BY journal_id HAVING sum(debit) <> sum(credit) OR sum(debit) = 0) x;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: % unbalanced journals', bad; END IF;
  SELECT count(*) INTO bad FROM (SELECT journal_id FROM erp_journal_lines WHERE company_id = co GROUP BY journal_id HAVING sum(debit) <> sum(credit)) x;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: company ledger has % unbalanced journals', bad; END IF;
  IF NOT EXISTS (SELECT 1 FROM erp_journals WHERE source_document_id = exp) THEN RAISE EXCEPTION 'FAIL: expense not posted'; END IF;
  IF NOT EXISTS (SELECT 1 FROM erp_journals j JOIN erp_payments p ON p.id = j.source_payment_id WHERE p.reference = 'AUTOTEST-REF') THEN RAISE EXCEPTION 'FAIL: refund not posted'; END IF;

  -- 2. Isolation: all records belong to the Kenya company and warehouse only
  SELECT count(*) INTO bad FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv) AND (company_id <> co OR currency <> 'KES');
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: documents outside Kenya company/KES'; END IF;
  SELECT count(*) INTO bad FROM erp_journal_lines WHERE journal_id = ANY(touched) AND company_id <> co;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: ledger lines leaked to other company'; END IF;
  SELECT count(*) INTO bad FROM erp_stock_movements WHERE item = item AND warehouse_id <> wh AND reference = 'AUTOTEST';
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: stock movement in other warehouse'; END IF;
  -- other locations: no ERP company for any other warehouse can see these records
  SELECT count(*) INTO bad FROM erp_documents d JOIN erp_companies c ON c.id = d.company_id WHERE d.id IN (inv, crn, exp, so, so_inv) AND c.warehouse_id IS DISTINCT FROM wh;
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: documents visible under another warehouse'; END IF;
  -- global (HQ/other location) modules never receive Kenya document numbers
  SELECT count(*) INTO bad FROM stone_quotations q WHERE q.number IN (SELECT number FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv));
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: Kenya document appears in global quotations'; END IF;
  SELECT count(*) INTO bad FROM stone_shipments s WHERE s.reference IN (SELECT number FROM erp_documents WHERE id IN (inv, crn, exp, so, so_inv));
  IF bad > 0 THEN RAISE EXCEPTION 'FAIL: Kenya document appears in global shipments'; END IF;

  RAISE NOTICE 'PASS: Kenya ledger balanced and location-isolated';
END $$;

ROLLBACK;
