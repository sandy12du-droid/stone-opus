import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KenyaData } from "@/lib/kenya-erp";

export function CompanySettings({ data }: { data: KenyaData }) {
  const c = data.company;
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: c.name, pin: c.kra_pin ?? "", address: c.address ?? "", phone: c.phone ?? "", email: c.email ?? "", bank: c.bank_details ?? "", mpesa: c.mpesa_details ?? "" });
  const mutation = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc("erp_save_company", { p_company: c.id, p_name: form.name, p_pin: form.pin, p_address: form.address, p_phone: form.phone, p_email: form.email, p_bank: form.bank, p_mpesa: form.mpesa }); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["kenya-erp"] }) });
  return <div className="max-w-2xl"><div className="mb-6 flex gap-8 border-y border-border py-4 text-sm"><div><p className="text-xs text-muted-foreground">Base currency</p><p className="mt-1 font-semibold">KES · Kenyan shilling</p></div><div><p className="text-xs text-muted-foreground">Country</p><p className="mt-1 font-semibold">Kenya</p></div></div>
    <form className="space-y-5" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}><div className="grid gap-4 sm:grid-cols-2">{([["name", "Company name"], ["pin", "KRA PIN"], ["address", "Address"], ["phone", "Phone"], ["email", "Email"], ["bank", "Bank details"], ["mpesa", "M-Pesa payment details"]] as const).map(([key, label]) => <div className="grid gap-1.5" key={key}><Label htmlFor={`company-${key}`}>{label}</Label><Input id={`company-${key}`} value={form[key]} required={key === "name"} type={key === "email" ? "email" : "text"} maxLength={500} disabled={data.role !== "owner"} onChange={e => setForm({ ...form, [key]: e.target.value })} /></div>)}</div>
    {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}{mutation.isSuccess && <p role="status" className="text-sm text-success">Company details saved.</p>}
    {data.role === "owner" && <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save company details"}</Button>}</form>
  </div>;
}