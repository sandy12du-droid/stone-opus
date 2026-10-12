# Tasks
- [x] Correct and verify selected-location currency across the requested pages.
- [x] Add company/warehouse location setup with an explicit currency.
- [x] Scope records, summaries, sample screens and creation currencies to the selected location; new locations start empty.
- [x] Verify creation, empty-location views, record read-back and location switch-back.

## Kenya accounting and inventory ERP
- [x] Define Kenya-only architecture, schema, accounting rules and transaction flows from the uploaded brief.
- [x] Build secured company setup, persisted customer/supplier masters and transaction-derived financial overview; verify saved records, zero balances and HQ isolation.
- [x] Kenya sales invoices (KSh), stock receiving/transfers/adjustments with audit trail, invoice + stock posting to ledger, customer payments.
- [ ] Build purchasing, sales orders and purchase bills.
- [ ] Implement expenses, credit notes and financial statements.
- [ ] Implement invoice printing/sharing, configurable Kenya tax and clearly labelled eTIMS test integration.
- [ ] Add approvals, scoped search, exports and end-to-end accounting/location-isolation tests.

Invoices post through the stock-aware posting function; period locks and approvals are still pending. Live email, WhatsApp Business and KRA eTIMS require provider configuration.