import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Search, DollarSign, FileText, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { INVOICE_STATUSES, INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR, type InvoiceStatus } from "@/lib/invoiceConstants";

export const Route = createFileRoute("/admin/invoices")({
  head: () => ({ meta: [{ title: "Admin — Finance" }, { name: "robots", content: "noindex" }] }),
  component: InvoicesAdmin,
});

type Invoice = {
  id: string; invoice_number: string; client_id: string; status: InvoiceStatus;
  issue_date: string; due_date: string | null; currency: string; total: number;
  client?: { id: string; name: string; email: string } | null;
};

function InvoicesAdmin() {
  const [items, setItems] = useState<Invoice[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.from("invoices").select("*, client:clients(id,name,email)").order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as unknown as Invoice[]) ?? []));
  }, []);

  const filtered = useMemo(() => items?.filter((i) => {
    if (filter !== "all" && i.status !== filter) return false;
    if (q) {
      const s = q.toLowerCase();
      return i.invoice_number.toLowerCase().includes(s) || (i.client?.name ?? "").toLowerCase().includes(s);
    }
    return true;
  }) ?? null, [items, q, filter]);

  const stats = useMemo(() => {
    if (!items) return { paid: 0, outstanding: 0, overdue: 0, count: items?.length ?? 0 };
    const paid = items.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total), 0);
    const outstanding = items.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
    const overdue = items.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total), 0);
    return { paid, outstanding, overdue, count: items.length };
  }, [items]);

  return (
    <AdminShell title="Finance" subtitle="Invoices, payments, and revenue">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <KPI label="Paid (lifetime)" value={`$${stats.paid.toLocaleString()}`} icon={CheckCircle2} tone="emerald" />
        <KPI label="Outstanding" value={`$${stats.outstanding.toLocaleString()}`} icon={Clock} tone="blue" />
        <KPI label="Overdue" value={`$${stats.overdue.toLocaleString()}`} icon={AlertTriangle} tone="red" />
        <KPI label="Total Invoices" value={String(stats.count)} icon={FileText} tone="muted" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by invoice # or client" className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</option>)}
        </select>
        <Link to="/admin/invoices/new" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Invoice
        </Link>
      </div>

      {filtered === null ? <Loader2 className="animate-spin" /> : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No invoices yet — create your first one above.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to="/admin/invoices/$id" params={{ id: i.id }} className="hover:text-primary">{i.invoice_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{i.client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(i.issue_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.due_date ? new Date(i.due_date).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 font-semibold">{i.currency} {Number(i.total).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${INVOICE_STATUS_COLOR[i.status]}`}>{INVOICE_STATUS_LABEL[i.status]}</span></td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/invoices/$id" params={{ id: i.id }} className="rounded-md border border-input px-3 py-1 text-xs hover:bg-secondary">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function KPI({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof DollarSign; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    red: "text-red-600 bg-red-500/10",
    muted: "text-muted-foreground bg-secondary",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon size={14} /></span>
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
