import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({ meta: [{ title: "Admin — Pricing" }, { name: "robots", content: "noindex" }] }),
  component: PricingAdmin,
});

type P = {
  id: string;
  name: string;
  price: string;
  period: string | null;
  description: string | null;
  features: string[];
  highlighted: boolean;
  cta_label: string;
  order_index: number;
};

const empty: Omit<P, "id"> = { name: "", price: "$0", period: "one-time", description: "", features: [], highlighted: false, cta_label: "Get Started", order_index: 0 };

function PricingAdmin() {
  const [items, setItems] = useState<P[] | null>(null);
  const [editing, setEditing] = useState<Partial<P> | null>(null);
  const [featuresText, setFeaturesText] = useState("");

  const load = async () => {
    const { data } = await supabase.from("pricing_plans").select("*").order("order_index");
    setItems((data as unknown as P[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (p: Partial<P>) => {
    setEditing(p);
    setFeaturesText((p.features ?? []).join("\n"));
  };

  const save = async () => {
    if (!editing?.name) return;
    const features = featuresText.split("\n").map((l) => l.trim()).filter(Boolean);
    const payload = {
      name: editing.name,
      price: editing.price || "$0",
      period: editing.period || null,
      description: editing.description || null,
      features,
      highlighted: !!editing.highlighted,
      cta_label: editing.cta_label || "Get Started",
      order_index: editing.order_index ?? 0,
    };
    if (editing.id) await supabase.from("pricing_plans").update(payload).eq("id", editing.id);
    else await supabase.from("pricing_plans").insert(payload);
    setEditing(null);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("pricing_plans").delete().eq("id", id);
    load();
  };

  return (
    <AdminShell title="Pricing Plans">
      <div className="mb-4 flex justify-end">
        <button onClick={() => startEdit({ ...empty })} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Plan
        </button>
      </div>

      {items === null ? <Loader2 className="animate-spin" /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No pricing plans yet.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className={`rounded-xl border p-5 ${p.highlighted ? "border-gold bg-card" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg">{p.name}</h3>
                {p.highlighted && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-gold">Featured</span>}
              </div>
              <p className="mt-2 text-2xl font-semibold">{p.price}<span className="text-xs text-muted-foreground"> / {p.period}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{p.features.length} features</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => startEdit(p)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
                <button onClick={() => remove(p.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit" : "New"} Plan</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (e.g. $499)" value={editing.price || ""} onChange={(v) => setEditing({ ...editing, price: v })} />
                <Field label="Period (e.g. one-time, /mo)" value={editing.period || ""} onChange={(v) => setEditing({ ...editing, period: v })} />
              </div>
              <Field label="Description" value={editing.description || ""} onChange={(v) => setEditing({ ...editing, description: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium">Features (one per line)</label>
                <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA label" value={editing.cta_label || ""} onChange={(v) => setEditing({ ...editing, cta_label: v })} />
                <div>
                  <label className="mb-1 block text-sm font-medium">Order</label>
                  <input type="number" value={editing.order_index ?? 0} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.highlighted} onChange={(e) => setEditing({ ...editing, highlighted: e.target.checked })} />
                Highlight as featured plan
              </label>
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
