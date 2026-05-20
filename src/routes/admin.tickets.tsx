import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/admin/tickets")({
  head: () => ({ meta: [{ title: "Support Tickets — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTickets,
});

type Row = { id: string; subject: string; category: string; priority: string; status: string; updated_at: string; client_id: string; clients: { name: string; email: string } | null };

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  pending: "bg-yellow-500/10 text-yellow-700",
  resolved: "bg-green-500/10 text-green-600",
  closed: "bg-zinc-500/10 text-zinc-600",
};

function AdminTickets() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("support_tickets")
        .select("id,subject,category,priority,status,updated_at,client_id,clients(name,email)")
        .order("updated_at", { ascending: false });
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (q && !`${r.subject} ${r.clients?.name ?? ""} ${r.clients?.email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminShell title="Support Tickets">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject or client…" className="rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <p className="ml-auto text-xs text-muted-foreground">{filtered.length} of {rows.length}</p>
      </div>

      {loading ? <Loader2 className="animate-spin" /> : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <LifeBuoy className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tickets match.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Subject</th><th className="p-3 text-left">Client</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Priority</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Updated</th></tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="p-3"><Link to="/admin/tickets/$id" params={{ id: t.id }} className="font-medium hover:underline">{t.subject}</Link></td>
                  <td className="p-3"><div>{t.clients?.name}</div><div className="text-xs text-muted-foreground">{t.clients?.email}</div></td>
                  <td className="p-3 capitalize text-muted-foreground">{t.category}</td>
                  <td className="p-3 capitalize">{t.priority}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_COLOR[t.status] ?? ""}`}>{t.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
