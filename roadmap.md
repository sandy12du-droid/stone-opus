# Tasks
- [x] Correct and verify selected-location currency across the requested pages.
- [x] Add company/warehouse location setup with an explicit currency.
- [x] Scope records, summaries, sample screens and creation currencies to the selected location; new locations start empty.
- [x] Verify creation, empty-location views, record read-back and location switch-back.

## Kenya accounting and inventory ERP
- [x] Define Kenya-only architecture, schema, accounting rules and transaction flows from the uploaded brief.
- [x] Build secured company setup, persisted customer/supplier masters and transaction-derived financial overview; verify saved records, zero balances and HQ isolation.
- [x] Kenya sales invoices (KSh), stock receiving/transfers/adjustments with audit trail, invoice + stock posting to ledger, customer payments.
- [x] Purchase orders, warehouse receiving and supplier bills.
- [x] Sales orders.
- [x] Credit notes with reversing entries; P&L, balance sheet and cash flow statements.
- [x] Expenses, customer refunds.
- [x] Invoice PDFs, email/WhatsApp hand-off with recorded status, configurable tax codes, eTIMS test-mode validation.
- [ ] Live email/WhatsApp delivery confirmation and live KRA eTIMS submission (blocked: provider accounts and KRA credentials).
- [x] Approval threshold workflow; CSV exports for invoices, stock and ledger.
- [ ] Scoped search and automated accounting/location-isolation tests.

Invoices post through the stock-aware posting function; period locks and approvals are still pending. Live email, WhatsApp Business and KRA eTIMS require provider configuration.