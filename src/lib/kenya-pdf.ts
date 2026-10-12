import type { KenyaData } from "@/lib/kenya-erp";

const kes = (n: number) => "KSh " + n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TITLES: Record<string, string> = { invoice: "TAX INVOICE", bill: "SUPPLIER BILL", purchase_order: "PURCHASE ORDER", credit_note: "CREDIT NOTE", sales_order: "SALES ORDER", expense: "EXPENSE" };
const GREEN: [number, number, number] = [11, 61, 46];

async function load() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  return { jsPDF, autoTable };
}

function header(pdf: InstanceType<Awaited<ReturnType<typeof load>>["jsPDF"]>, c: KenyaData["company"], title: string) {
  pdf.setFillColor(...GREEN); pdf.rect(0, 0, 210, 4, "F");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.text(c.name, 14, 18);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5);
  const lines = [c.address, [c.phone, c.email].filter(Boolean).join(" · "), c.kra_pin ? `KRA PIN ${c.kra_pin}` : ""].filter(Boolean) as string[];
  lines.forEach((l, i) => pdf.text(l, 14, 24 + i * 4.5));
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.setTextColor(...GREEN); pdf.text(title, 196, 18, { align: "right" }); pdf.setTextColor(0);
}

export async function downloadDocumentPdf(data: KenyaData, doc: KenyaData["documents"][number], paid: number) {
  const { jsPDF, autoTable } = await load();
  const pdf = new jsPDF();
  header(pdf, data.company, TITLES[doc.kind] ?? doc.kind.toUpperCase());
  const party = data.parties.find(p => p.id === doc.party_id);
  pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
  const meta = [["Number", doc.number], ["Date", doc.document_date], ["Due", doc.due_date], ["Status", doc.status], ...(doc.supplier_reference ? [["Supplier ref", doc.supplier_reference]] : [])];
  meta.forEach(([k, v], i) => { pdf.text(k, 140, 28 + i * 5); pdf.text(String(v), 196, 28 + i * 5, { align: "right" }); });
  pdf.setFont("helvetica", "bold"); pdf.text(doc.kind === "invoice" || doc.kind === "credit_note" ? "Bill to" : "Supplier", 14, 50);
  pdf.setFont("helvetica", "normal");
  [party?.name, party?.company_name, party?.address, party?.kra_pin ? `KRA PIN ${party.kra_pin}` : ""].filter(Boolean).forEach((l, i) => pdf.text(String(l), 14, 55 + i * 4.5));
  const items = data.items.filter(i => i.document_id === doc.id);
  autoTable(pdf, {
    startY: 76, headStyles: { fillColor: GREEN }, styles: { fontSize: 8.5 },
    head: [["Description", "Qty", "Unit price", "Discount", "Net", "VAT"]],
    body: items.map(i => [i.description + (i.stock_item ? `\n${i.stock_item}` : ""), `${Number(i.quantity)} ${i.unit}`, kes(Number(i.unit_price)), kes(Number(i.discount)), kes(Number(i.net_amount)), kes(Number(i.tax_amount))]),
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });
  let y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const totals: [string, number][] = [["Subtotal", Number(doc.subtotal)], ["VAT", Number(doc.tax_amount)], ["Total", Number(doc.total)]];
  if (doc.kind === "invoice" || doc.kind === "bill") totals.push(["Paid", paid], ["Balance due", doc.status === "posted" ? Number(doc.total) - paid : 0]);
  totals.forEach(([k, v]) => { pdf.setFont("helvetica", k === "Total" || k === "Balance due" ? "bold" : "normal"); pdf.text(k, 140, y); pdf.text(kes(v), 196, y, { align: "right" }); y += 5.5; });
  pdf.setFont("helvetica", "normal"); y += 4;
  if (doc.notes) { pdf.text(pdf.splitTextToSize(`Notes: ${doc.notes}`, 182), 14, y); y += 10; }
  if (doc.kind === "invoice") {
    const pay = [data.company.bank_details && `Bank: ${data.company.bank_details}`, data.company.mpesa_details && `M-Pesa: ${data.company.mpesa_details}`].filter(Boolean) as string[];
    if (pay.length) { pdf.setFont("helvetica", "bold"); pdf.text("Payment details", 14, y); pdf.setFont("helvetica", "normal"); pay.forEach((l, i) => pdf.text(pdf.splitTextToSize(l, 182), 14, y + 5 + i * 5)); }
  }
  pdf.setFontSize(7.5); pdf.setTextColor(120); pdf.text("Amounts in Kenyan shillings. Not an eTIMS-validated document.", 14, 288);
  pdf.save(`${doc.number}.pdf`);
}

export type PdfSection = { title: string; rows: { code: string; name: string; amount: number }[]; total: [string, number] };
export async function downloadStatementPdf(data: KenyaData, title: string, period: string, sections: PdfSection[], grand: [string, number], note?: string) {
  const { jsPDF, autoTable } = await load();
  const pdf = new jsPDF();
  header(pdf, data.company, title.toUpperCase());
  pdf.setFontSize(9); pdf.setFont("helvetica", "normal"); pdf.text(`${period} · KSh · from posted ledger entries`, 14, 44);
  const body: (string | { content: string; styles: object })[][] = [];
  for (const s of sections) {
    body.push([{ content: s.title, styles: { fontStyle: "bold", fillColor: [240, 240, 236] } }, { content: "", styles: { fillColor: [240, 240, 236] } }]);
    for (const r of s.rows) body.push([`${r.code ? r.code + "  " : ""}${r.name}`, kes(r.amount)]);
    body.push([{ content: s.total[0], styles: { fontStyle: "bold" } }, { content: kes(s.total[1]), styles: { fontStyle: "bold" } }]);
  }
  body.push([{ content: grand[0], styles: { fontStyle: "bold", fillColor: GREEN, textColor: 255 } }, { content: kes(grand[1]), styles: { fontStyle: "bold", fillColor: GREEN, textColor: 255 } }]);
  autoTable(pdf, { startY: 50, body, styles: { fontSize: 9 }, columnStyles: { 1: { halign: "right" } }, theme: "plain" });
  if (note) pdf.text(note, 14, (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8);
  pdf.save(`${title.replace(/\s+/g, "-")}-${period.replace(/\s+/g, "_")}.pdf`);
}
