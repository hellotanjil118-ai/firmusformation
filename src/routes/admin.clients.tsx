import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Search, X, Save } from "lucide-react";

export const Route = createFileRoute("/admin/clients")({
  head: () => ({ meta: [{ title: "Admin — Clients" }, { name: "robots", content: "noindex" }] }),
  component: ClientsAdmin,
});

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  status: string;
  notes: string | null;
  user_id: string | null;
  created_at: string;
};

const STATUSES = ["prospect", "active", "paused", "churned"] as const;
const empty: Omit<Client, "id" | "created_at"> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  country: "",
  status: "prospect",
  notes: "",
  user_id: null,
};

function ClientsAdmin() {
  const [items, setItems] = useState<Client[] | null>(null);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setItems((data as Client[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    return items.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q) {
        const s = q.toLowerCase();
        return c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || (c.company ?? "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [items, q, statusFilter]);

  const save = async () => {
    if (!editing?.name || !editing?.email) { setErr("Name and email are required"); return; }
    setErr(null);
    const payload = {
      name: editing.name,
      email: editing.email,
      phone: editing.phone || null,
      company: editing.company || null,
      country: editing.country || null,
      status: editing.status || "prospect",
      notes: editing.notes || null,
    };
    const res = editing.id
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (res.error) { setErr(res.error.message); return; }
    setEditing(null);
    load();
  };

  return (
    <AdminShell title="Clients">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Client
        </button>
      </div>

      {filtered === null ? <Loader2 className="animate-spin" /> : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No clients found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">
                    <Link to="/admin/clients/$id" params={{ id: c.id }} className="hover:text-primary">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.company || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "active" ? "bg-green-500/10 text-green-600" :
                      c.status === "prospect" ? "bg-blue-500/10 text-blue-600" :
                      c.status === "paused" ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.user_id ? "Linked" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(c)} className="rounded-md border border-input px-3 py-1 text-xs hover:bg-secondary">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit Client" : "New Client"}</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name *" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
                <Field label="Email *" value={editing.email || ""} onChange={(v) => setEditing({ ...editing, email: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" value={editing.phone || ""} onChange={(v) => setEditing({ ...editing, phone: v })} />
                <Field label="Company" value={editing.company || ""} onChange={(v) => setEditing({ ...editing, company: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country" value={editing.country || ""} onChange={(v) => setEditing({ ...editing, country: v })} />
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select value={editing.status || "prospect"} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button onClick={save} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}
