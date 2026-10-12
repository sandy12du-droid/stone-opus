import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { saveKenyaParty } from "@/lib/kenya-erp.functions";
import type { KenyaData } from "@/lib/kenya-erp";

export function PartyEditor({ data, kind, party, close }: { data: KenyaData; kind: "customer" | "supplier"; party?: KenyaData["parties"][number]; close: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveKenyaParty);
  const [form, setForm] = useState({ name: party?.name ?? "", company_name: party?.company_name ?? "", kra_pin: party?.kra_pin ?? "", phone: party?.phone ?? "", whatsapp: party?.whatsapp ?? "", email: party?.email ?? "", address: party?.address ?? "", city: party?.city ?? "", county: party?.county ?? "", contact_person: party?.contact_person ?? "", credit_limit: String(party?.credit_limit ?? 0), payment_terms: String(party?.payment_terms ?? 30), currency: party?.currency ?? "KES", customer_type: party?.customer_type ?? "", bank_details: party?.bank_details ?? "", notes: party?.notes ?? "", vat_registered: party?.vat_registered ?? false });
  const mutation = useMutation({ mutationFn: () => save({ data: { ...form, id: party?.id, company_id: data.company.id, kind, credit_limit: Number(form.credit_limit), payment_terms: Number(form.payment_terms) } }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["kenya-erp"] }); close(); } });
  const fields = [["name", "Name"], ["company_name", "Company name"], ["kra_pin", "KRA PIN"], ["phone", "Phone"], ["whatsapp", "WhatsApp number"], ["email", "Email"], ["address", "Address"], ["city", "City"], ["county", "County"], ["contact_person", "Contact person"], ["credit_limit", "Credit limit (KES)"], ["payment_terms", "Payment terms (days)"], ["currency", "Currency"], ["customer_type", "Customer type"], ["bank_details", "Bank details"], ["notes", "Notes"]] as const;
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]"><DialogHeader><DialogTitle>{party ? "Edit" : "New"} {kind}</DialogTitle></DialogHeader>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{fields.map(([key, label]) => <div className="grid gap-1.5" key={key}><Label htmlFor={`party-${key}`}>{label}</Label><Input id={`party-${key}`} value={form[key]} required={key === "name" || key === "currency"} maxLength={key === "currency" ? 3 : 500} type={key === "email" ? "email" : key === "credit_limit" || key === "payment_terms" ? "number" : "text"} min={0} step={key === "credit_limit" ? "0.01" : "1"} onChange={e => setForm({ ...form, [key]: key === "currency" ? e.target.value.toUpperCase() : e.target.value })} /></div>)}</div>
      <div className="flex items-center gap-2"><Checkbox id="party-vat" checked={form.vat_registered} onCheckedChange={checked => setForm({ ...form, vat_registered: checked === true })} /><Label htmlFor="party-vat">VAT registered</Label></div>
      {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
    </form></DialogContent></Dialog>;
}