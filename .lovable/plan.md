# Kenya location: stone accounting and inventory ERP

## Scope
Extend **Arquane Surfaces Kenya Limited** with the ERP described in your uploaded brief. Keep the existing Arquane OS design, sign-in, and other locations unchanged. Kenya gets sales, purchasing, individual slab inventory, invoicing, payments, expenses, accounting, reporting, and Kenya tax settings.

All operational and financial records belong to the Kenya company. New companies remain empty. Kenya demo transactions will be an explicit test-data option, not automatically added to live accounts.

## Build sequence
1. **Foundation:** company accounting settings, Kenya company access, customer and supplier records, configurable taxes, chart of accounts, numbering, and a financial overview calculated from saved transactions.
2. **Core transactions:** quotations → sales orders → invoices; suppliers → purchase orders → goods received → purchase bills. Add individual slab receiving, reservation, sale, transfer, return, damage, and approved adjustment histories.
3. **Accounting:** automatic balanced journals, customer and supplier payment allocation, cash/bank/M-Pesa accounts, expenses, credit notes, receivables/payables aging, general ledger, trial balance, profit and loss, balance sheet, and cash flow.
4. **Invoices and communication:** invoice editor, printable/downloadable invoice PDF, statements, WhatsApp prefilled messages, email delivery adapter, and communication history. Actual delivery statuses must come from the provider, not simulated success.
5. **Kenya tax:** configurable VAT categories and reports, company KRA PIN settings, and an eTIMS submission queue with test mode, retry history, responses, and audit logs. No claim of KRA certification or live submission without an approved connection.
6. **Controls and verification:** approvals, credit warnings, scoped global search, report date filters and CSV/Excel/PDF exports, granular permissions, and complete transaction/location-isolation testing.

Each phase delivers working saved records and tested workflows, not placeholder screens. Features requiring unavailable external services remain explicitly disconnected or in test mode.

## Technical architecture

### Company and warehouse isolation
- Introduce a stable company entity and link the existing Kenya operating warehouse to it. Keep company ownership separate from warehouses so Kenya can later have multiple warehouses without splitting its accounting books.
- Persist company memberships and role permissions; database policies and transaction functions validate access to the selected company. Selecting a company in the browser is never sufficient authorization.
- Every ERP record and query cache key includes company identity; warehouse-specific inventory also includes warehouse identity. Cross-company references are rejected. Kenya financial records never appear in the HQ aggregate view.
- Reuse existing auth and quotations/products/slabs where safe through additive links. Existing static CRM examples are not treated as accounting customer records or opening balances.
- Add Kenya-specific navigation only while the Kenya company is selected; direct links still validate company access. Retain existing URLs and other locations' workflows.

### Relational schema
Create the schema in coherent additive migrations, before the associated screens:
- **Setup:** companies, company memberships/permissions, accounting settings, financial periods, document counters, tax codes, units, and accounts.
- **Masters:** customers and suppliers with KRA PIN, contact details, terms, currency, credit limits and account references.
- **Sales:** sales orders/items, invoices/items, customer payments and allocations, credit notes/items; link existing quotations through company-safe relationships.
- **Purchasing:** purchase orders/items, goods receipts/items, purchase bills/items, supplier payments and allocations.
- **Inventory:** company/product/warehouse links, slab cost/batch fields, stock movements and adjustment approvals; retain complete movement provenance.
- **Accounting:** journal headers/lines, expenses, tax transactions, and payment accounts. Journals reference their source document and reversals.
- **Operations:** approval requests, attachments, communication logs, eTIMS submissions/attempts, and append-only business audit events.

Use explicit grants, enabled row-level security, authenticated company-scoped policies, safe defaults, relational constraints, and private attachment storage. Do not modify managed authentication tables beyond supported application-owned role handling.

### Accounting rules
- Post financial documents atomically in database transaction functions: validate permissions and document state, lock affected records, assign controlled numbering, calculate taxes, write journals, move stock, and append audit records together.
- Use fixed-precision decimal amounts with deliberate rounding; never browser floating-point math as the authoritative ledger.
- Every posted journal must balance, with at least two valid lines. Balances derive from posted journal lines, never editable balance fields.
- **Sales invoice:** debit receivables; credit revenue and output VAT. Stock fulfillment debits cost of goods sold and credits inventory exactly once at the defined delivery/invoicing event.
- **Customer payment:** debit cash/bank/M-Pesa and credit receivables; allocations update invoice balances without exceeding payment or invoice balances.
- **Purchase bill:** debit inventory/cost and recoverable input VAT; credit payables. Goods receipts and bills share quantity/cost provenance to prevent double-counting inventory.
- **Supplier payment:** debit payables and credit the payment account. **Expense:** debit expense and eligible input VAT; credit payment account or payable.
- Credit notes, returns, and reversals reference original documents; issued/posted records cannot be edited or deleted. Drafts remain editable.
- Prevent duplicate posting and supplier invoice references; lock numbering and allocation operations against concurrent submissions. Respect period locks, credit limits, approval thresholds and default negative-stock prevention.
- Kenya base currency is KES. Store original currency, historical exchange rate, and KES posting amounts per transaction; changing today's display rate never changes historical journals.
- Tax calculation comes from saved tax codes. Standard VAT initially 16%; VAT position = output VAT − input VAT. KRA PIN requirements depend on the configured transaction/customer tax treatment.

### Application boundaries
Use the existing TanStack Start app and design-system controls. Protected server functions validate input and call authenticated company-scoped database functions; normal reads/writes do not bypass policies. Provider callbacks use verified server endpoints. Private keys stay in secrets, never browser settings or source code.

## Acceptance checks
- Kenya shows zero financial totals without transactions, not global demo figures; other locations keep their existing experience.
- Create customer → quotation → order → slab reservation → invoice → payment. Read each record back, verify balances, VAT, stock and balanced journals; partial payments work.
- Receive inventory → bill → supplier payment; record expense and credit note; confirm all report totals reconcile to the ledger.
- Attempt duplicate posting, over-allocation, negative stock, unauthorized posting, edits to posted journals, and cross-company access; every invalid operation is rejected.
- Switch Kenya ↔ HQ ↔ a new company and verify no ERP records or balances leak. Check invoice viewing and approvals on narrow screens.
- Confirm invoice exports, report filters, audit trails, and test-mode integration statuses accurately represent what occurred.

## External dependencies
Live email delivery, WhatsApp Business delivery, and approved KRA eTIMS submission need the relevant provider access/configuration. Build their secure interfaces and honest test/disconnected states first; connect live services only when access is available.