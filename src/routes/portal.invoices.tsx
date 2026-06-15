import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Receipt, Loader2, ArrowRight } from "lucide-react";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR, type InvoiceStatus } from "@/lib/invoiceConstants";

export const Route = createFileRoute("/portal/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalInvoices,
});

type Invoice = {
  id: string; invoice_number: string; status: InvoiceStatus;
  issue_date: string; due_date: string | null; currency: string; total: number;
};

function PortalInvoices() {
  const { user } = useAuth();
  const [items, setItems] = useState<Invoice[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await supabase.rpc("claim_client_by_email" as never);
      const { data } = await supabase.from("invoices").select("*").order("issue_date", { ascending: false });
      setItems((data as unknown as Invoice[]) ?? []);
    })();
  }, [user]);

  const outstanding = items?.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.total), 0) ?? 0;
  const paid = items?.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0) ?? 0;

  return (
    <PortalShell title="Invoices & Payments">
      {items && items.length > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Outstanding</p>
            <p className="mt-1 font-display text-2xl">${outstanding.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Paid (lifetime)</p>
            <p className="mt-1 font-display text-2xl text-emerald-600">${paid.toFixed(2)}</p>
          </div>
        </div>
      )}

      {items === null ? <Loader2 className="animate-spin" /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Receipt className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-display text-lg">No invoices yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Once an invoice is generated for your service, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((i) => (
            <Link key={i.id} to="/portal/invoices/$id" params={{ id: i.id }} className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
              <div>
                <p className="font-mono text-sm font-semibold">{i.invoice_number}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Issued {new Date(i.issue_date).toLocaleDateString()}</span>
                  {i.due_date && <span>· Due {new Date(i.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-lg">{i.currency} {Number(i.total).toFixed(2)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${INVOICE_STATUS_COLOR[i.status]}`}>{INVOICE_STATUS_LABEL[i.status]}</span>
                <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
