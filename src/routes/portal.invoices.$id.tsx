import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR, type InvoiceStatus, type InvoiceItem } from "@/lib/invoiceConstants";

export const Route = createFileRoute("/portal/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalInvoiceDetail,
});

type Invoice = {
  id: string; invoice_number: string; status: InvoiceStatus;
  issue_date: string; due_date: string | null; paid_at: string | null;
  currency: string; subtotal: number; tax: number; discount: number; total: number;
  notes: string | null; payment_instructions: string | null;
  payment_method: string | null; payment_reference: string | null;
  items: InvoiceItem[];
};

function PortalInvoiceDetail() {
  const { id } = Route.useParams();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("invoices").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setInv(data ? { ...(data as unknown as Invoice), items: (data.items as unknown as InvoiceItem[]) ?? [] } : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <PortalShell title="Invoice"><Loader2 className="animate-spin" /></PortalShell>;
  if (!inv) return <PortalShell title="Not found"><p className="text-muted-foreground">Invoice not found.</p></PortalShell>;

  return (
    <PortalShell title={inv.invoice_number}>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/portal/invoices" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back</Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary">
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card p-8 print:border-0 print:shadow-none">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl">Invoice</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{inv.invoice_number}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs ${INVOICE_STATUS_COLOR[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-muted-foreground">From</p>
            <p className="mt-1 font-medium">Firmus Formation</p>
            <p className="text-muted-foreground">Amazon FBA & eCommerce Agency</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Issued</p>
            <p className="mt-1">{new Date(inv.issue_date).toLocaleDateString()}</p>
            {inv.due_date && <><p className="mt-2 text-xs uppercase text-muted-foreground">Due</p><p>{new Date(inv.due_date).toLocaleDateString()}</p></>}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <tr><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit Price</th><th className="py-2 text-right">Total</th></tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-3">{it.description}</td>
                <td className="py-3 text-right">{it.quantity}</td>
                <td className="py-3 text-right">{inv.currency} {Number(it.unit_price).toFixed(2)}</td>
                <td className="py-3 text-right font-medium">{inv.currency} {(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{inv.currency} {Number(inv.subtotal).toFixed(2)}</span></div>
          {Number(inv.tax) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{inv.currency} {Number(inv.tax).toFixed(2)}</span></div>}
          {Number(inv.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>− {inv.currency} {Number(inv.discount).toFixed(2)}</span></div>}
          <div className="flex justify-between border-t border-border pt-2 font-display text-lg"><span>Total</span><span>{inv.currency} {Number(inv.total).toFixed(2)}</span></div>
        </div>

        {inv.status === "paid" ? (
          <div className="mt-6 rounded-lg bg-emerald-500/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-emerald-700"><CheckCircle2 size={16} /> Paid {inv.paid_at && new Date(inv.paid_at).toLocaleDateString()}</p>
            {inv.payment_method && <p className="mt-1 text-xs text-emerald-700/80">Via {inv.payment_method}{inv.payment_reference && ` — ref ${inv.payment_reference}`}</p>}
          </div>
        ) : inv.payment_instructions && (
          <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
            <p className="mb-2 font-semibold">Payment Instructions</p>
            <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">{inv.payment_instructions}</pre>
          </div>
        )}

        {inv.notes && (
          <div className="mt-4 text-xs text-muted-foreground"><p className="font-medium">Notes</p><p className="mt-1">{inv.notes}</p></div>
        )}
      </div>
    </PortalShell>
  );
}
