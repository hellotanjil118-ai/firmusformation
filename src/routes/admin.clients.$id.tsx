import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/clients/$id")({
  head: () => ({ meta: [{ title: "Admin — Client" }, { name: "robots", content: "noindex" }] }),
  component: ClientDetail,
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

function ClientDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      if (error) setErr(error.message);
      setClient(data as Client | null);
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    if (!client) return;
    setBusy(true); setErr(null); setSaved(false);
    const { error } = await supabase.from("clients").update({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      country: client.country,
      status: client.status,
      notes: client.notes,
    }).eq("id", client.id);
    setBusy(false);
    if (error) setErr(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const remove = async () => {
    if (!client || !confirm("Delete this client? This cannot be undone.")) return;
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) { setErr(error.message); return; }
    navigate({ to: "/admin/clients" });
  };

  return (
    <AdminShell title={client?.name || "Client"}>
      <Link to="/admin/clients" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} /> Back to clients
      </Link>

      {loading ? <Loader2 className="animate-spin" /> : !client ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Client not found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4 rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-lg">Profile</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" value={client.name} onChange={(v) => setClient({ ...client, name: v })} />
              <Field label="Email" value={client.email} onChange={(v) => setClient({ ...client, email: v })} />
              <Field label="Phone" value={client.phone || ""} onChange={(v) => setClient({ ...client, phone: v })} />
              <Field label="Company" value={client.company || ""} onChange={(v) => setClient({ ...client, company: v })} />
              <Field label="Country" value={client.country || ""} onChange={(v) => setClient({ ...client, country: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select value={client.status} onChange={(e) => setClient({ ...client, status: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Notes</label>
              <textarea value={client.notes || ""} onChange={(e) => setClient({ ...client, notes: e.target.value })} rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            {saved && <p className="text-sm text-green-600">Saved.</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />}<Save size={14} /> Save changes
              </button>
              <button onClick={remove} className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-display text-sm">Portal access</h3>
              <p className="text-xs text-muted-foreground">
                {client.user_id ? "This client has a linked login account." : "No login linked yet. Once a client signs up at /portal/login with the same email, link them via SQL or future UI."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-display text-sm">Created</h3>
              <p className="text-xs text-muted-foreground">{new Date(client.created_at).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-5 text-xs text-muted-foreground">
              Orders, invoices, and activity timeline will appear here in Batch 2 & 3.
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
