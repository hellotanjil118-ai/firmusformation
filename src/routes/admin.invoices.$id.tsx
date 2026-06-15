import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Plus, Trash2, Save, Send, Printer, CheckCircle2 } from "lucide-react";
import { INVOICE_STATUSES, INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR, DEFAULT_PAYMENT_INSTRUCTIONS, type InvoiceStatus, type InvoiceItem } from "@/lib/invoiceConstants";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices/$id")({
  head: () => ({ meta: [{ title: "Admin — Invoice" }, { name: "robots", content: "noindex" }] }),
  component: InvoiceEditor,
});

type Client = { id: string; name: string; email: string };
type Order = { id: string; package_name: string; price: number };

type Invoice = {
  id?: string; invoice_number?: string; client_id: string; order_id: string | null;
  status: InvoiceStatus; issue_date: string; due_date: string | null; paid_at: string | null;
  currency: string; subtotal: number; tax: number; discount: number; total: number;
  notes: string | null; payment_instructions: string | null; payment_method: string | null; payment_reference: string | null;
  items: InvoiceItem[];
};

const blank = (): Invoice => ({
  client_id: "", order_id: null, status: "draft",
  issue_date: new Date().toISOString().split("T")[0], due_date: null, paid_at: null,
  currency: "USD", subtotal: 0, tax: 0, discount: 0, total: 0,
  notes: "", payment_instructions: DEFAULT_PAYMENT_INSTRUCTIONS, payment_method: null, payment_reference: null,
  items: [{ description: "", quantity: 1, unit_price: 0 }],
});

function InvoiceEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [inv, setInv] = useState<Invoice | null>(isNew ? blank() : null);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("clients").select("id,name,email").order("name").then(({ data }) => setClients((data as Client[]) ?? []));
    if (!isNew) {
      supabase.from("invoices").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setInv({ ...(data as unknown as Invoice), items: (data.items as unknown as InvoiceItem[]) ?? [] });
      });
    }
  }, [id, isNew]);

  useEffect(() => {
    if (inv?.client_id) supabase.from("orders").select("id,package_name,price").eq("client_id", inv.client_id).then(({ data }) => setOrders((data as Order[]) ?? []));
  }, [inv?.client_id]);

  const totals = useMemo(() => {
    if (!inv) return { subtotal: 0, total: 0 };
    const subtotal = inv.items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
    const total = subtotal + Number(inv.tax || 0) - Number(inv.discount || 0);
    return { subtotal, total };
  }, [inv]);

  if (!inv) return <AdminShell title="Invoice"><Loader2 className="animate-spin" /></AdminShell>;

  const update = (patch: Partial<Invoice>) => setInv({ ...inv, ...patch });
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => update({ items: inv.items.map((it, i) => i === idx ? { ...it, ...patch } : it) });
  const addItem = () => update({ items: [...inv.items, { description: "", quantity: 1, unit_price: 0 }] });
  const removeItem = (idx: number) => update({ items: inv.items.filter((_, i) => i !== idx) });

  const save = async (overrideStatus?: InvoiceStatus) => {
    if (!inv.client_id) { toast.error("Pick a client"); return; }
    setSaving(true);
    const payload = {
      client_id: inv.client_id, order_id: inv.order_id, status: overrideStatus ?? inv.status,
      issue_date: inv.issue_date, due_date: inv.due_date, paid_at: overrideStatus === "paid" ? (inv.paid_at ?? new Date().toISOString()) : inv.paid_at,
      currency: inv.currency, subtotal: totals.subtotal, tax: Number(inv.tax) || 0, discount: Number(inv.discount) || 0, total: totals.total,
      notes: inv.notes, payment_instructions: inv.payment_instructions, payment_method: inv.payment_method, payment_reference: inv.payment_reference,
      items: inv.items,
    };
    if (isNew) {
      const { data, error } = await supabase.from("invoices").insert(payload).select().single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Invoice created");
      navigate({ to: "/admin/invoices/$id", params: { id: data.id } });
    } else {
      const { error } = await supabase.from("invoices").update(payload).eq("id", id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Saved");
      if (overrideStatus) setInv({ ...inv, status: overrideStatus });
    }
  };

  const remove = async () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await supabase.from("invoices").delete().eq("id", id);
    navigate({ to: "/admin/invoices" });
  };

  return (
    <AdminShell title={isNew ? "New Invoice" : inv.invoice_number ?? "Invoice"}>
      <Link to="/admin/invoices" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back to invoices</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">Line Items</h2>
              {!isNew && <span className={`rounded-full px-2 py-0.5 text-xs ${INVOICE_STATUS_COLOR[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1" />
              </div>
              {inv.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} placeholder="e.g. LLC Formation — Wyoming" className="col-span-6 rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                  <input type="number" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="col-span-2 rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm" />
                  <input type="number" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} className="col-span-2 rounded-md border border-input bg-background px-2 py-1.5 text-right text-sm" />
                  <div className="col-span-1 text-right text-sm font-medium">{(Number(it.quantity || 0) * Number(it.unit_price || 0)).toFixed(2)}</div>
                  <button onClick={() => removeItem(idx)} className="col-span-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={addItem} className="mt-2 inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary"><Plus size={12} /> Add line</button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-2 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Notes</label>
                  <textarea value={inv.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Payment Instructions (shown to client)</label>
                  <textarea value={inv.payment_instructions ?? ""} onChange={(e) => update({ payment_instructions: e.target.value })} rows={5} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={`${inv.currency} ${totals.subtotal.toFixed(2)}`} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Tax</span>
                  <input type="number" value={inv.tax} onChange={(e) => update({ tax: Number(e.target.value) })} className="w-28 rounded-md border border-input bg-background px-2 py-1 text-right text-sm" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Discount</span>
                  <input type="number" value={inv.discount} onChange={(e) => update({ discount: Number(e.target.value) })} className="w-28 rounded-md border border-input bg-background px-2 py-1 text-right text-sm" />
                </div>
                <Row label="Total" value={`${inv.currency} ${totals.total.toFixed(2)}`} bold />
                {inv.status === "paid" && (
                  <div className="mt-3 space-y-2 rounded-md bg-emerald-500/10 p-3 text-xs">
                    <div className="flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 size={12} /> Paid {inv.paid_at && new Date(inv.paid_at).toLocaleDateString()}</div>
                    {inv.payment_method && <p>Via {inv.payment_method}{inv.payment_reference && ` — ref ${inv.payment_reference}`}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Client *</label>
              <select value={inv.client_id} onChange={(e) => update({ client_id: e.target.value, order_id: null })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                <option value="">— Select —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            {orders.length > 0 && (
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Link to order (optional)</label>
                <select value={inv.order_id ?? ""} onChange={(e) => update({ order_id: e.target.value || null })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  <option value="">— None —</option>
                  {orders.map((o) => <option key={o.id} value={o.id}>{o.package_name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Issue date</label>
                <input type="date" value={inv.issue_date} onChange={(e) => update({ issue_date: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Due date</label>
                <input type="date" value={inv.due_date ?? ""} onChange={(e) => update({ due_date: e.target.value || null })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Currency</label>
                <input value={inv.currency} onChange={(e) => update({ currency: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Status</label>
                <select value={inv.status} onChange={(e) => update({ status: e.target.value as InvoiceStatus })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
            </div>
            {inv.status === "paid" && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Payment method</label>
                  <input value={inv.payment_method ?? ""} onChange={(e) => update({ payment_method: e.target.value })} placeholder="Wise / Payoneer / Bank" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Reference</label>
                  <input value={inv.payment_reference ?? ""} onChange={(e) => update({ payment_reference: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                </div>
              </>
            )}
          </div>

          <button onClick={() => save()} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
          {!isNew && (
            <>
              {inv.status === "draft" && (
                <button onClick={() => save("sent")} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary">
                  <Send size={14} /> Send to client
                </button>
              )}
              {inv.status !== "paid" && inv.status !== "draft" && (
                <button onClick={() => save("paid")} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-emerald-500/30 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-500/10">
                  <CheckCircle2 size={14} /> Mark as paid
                </button>
              )}
              <button onClick={() => window.print()} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary">
                <Printer size={14} /> Print / PDF
              </button>
              <button onClick={remove} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "border-t border-border pt-2 font-display text-lg" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
