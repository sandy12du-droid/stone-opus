import { queryOptions } from "@tanstack/react-query";
import { readKenya } from "@/lib/kenya-erp.functions";

export const kenyaSections = {
  overview: "Financial Overview", search: "Search Kenya Records", customers: "Customers", suppliers: "Suppliers",
  invoices: "Sales Invoices", sales_orders: "Sales Orders", purchase_orders: "Purchase Orders", stock: "Stock Movements",
  bills: "Purchase Bills", payments: "Payments", expenses: "Expenses",
  accounts: "Chart of Accounts", journals: "Journal Entries", ledger: "General Ledger",
  receivables: "Accounts Receivable", payables: "Accounts Payable", reports: "Financial Reports",
  tax: "Tax / eTIMS", approvals: "Approvals", audit: "Business Audit Trail", settings: "Company Settings",
} as const;
export type KenyaSection = keyof typeof kenyaSections;
export function isKenyaSection(value: string): value is KenyaSection { return value in kenyaSections; }

const fetchKenya = (warehouseId: string) => readKenya({ data: { warehouseId } });
export const kenyaOptions = (warehouseId: string) => queryOptions({ queryKey: ["kenya-erp", warehouseId], queryFn: () => fetchKenya(warehouseId) });
export type KenyaData = NonNullable<Awaited<ReturnType<typeof fetchKenya>>>;