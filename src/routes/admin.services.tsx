import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

export const Route = createFileRoute("/admin/services")({
  head: () => ({ meta: [{ title: "Admin — Services" }, { name: "robots", content: "noindex" }] }),
  component: ServicesAdmin,
});

type S = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  features: string[];
  order_index: number;
  published: boolean;
};

const empty: Omit<S, "id"> = { slug: "", title: "", description: "", icon: "", features: [], order_index: 0, published: true };

function ServicesAdmin() {
  const [items, setItems] = useState<S[] | null>(null);
  const [editing, setEditing] = useState<Partial<S> | null>(null);
  const [featuresText, setFeaturesText] = useState("");

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("order_index");
    setItems((data as unknown as S[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (s: Partial<S>) => {
    setEditing(s);
    setFeaturesText((s.features ?? []).join("\n"));
  };

  const save = async () => {
    if (!editing?.title || !editing.slug) return;
    const features = featuresText.split("\n").map((l) => l.trim()).filter(Boolean);
    const payload = {
      slug: editing.slug,
      title: editing.title,
      description: editing.description || "",
      icon: editing.icon || null,
      features,
      order_index: editing.order_index ?? 0,
      published: !!editing.published,
    };
    if (editing.id) await supabase.from("services").update(payload).eq("id", editing.id);
    else await supabase.from("services").insert(payload);
    setEditing(null);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };

  return (
    <AdminShell title="Services">
      <div className="mb-4 flex justify-end">
        <button onClick={() => startEdit({ ...empty })} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Service
        </button>
      </div>

      {items === null ? <Loader2 className="animate-spin" /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No services yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{s.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.published ? "bg-gold/20 text-gold" : "bg-secondary text-muted-foreground"}`}>
                    {s.published ? "Live" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">/{s.slug} · {s.features.length} features</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
                <button onClick={() => remove(s.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit" : "New"} Service</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title" value={editing.title || ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Field label="Slug" value={editing.slug || ""} onChange={(v) => setEditing({ ...editing, slug: v.toLowerCase().replace(/\s+/g, "-") })} />
              <Field label="Icon name (lucide)" value={editing.icon || ""} onChange={(v) => setEditing({ ...editing, icon: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Features (one per line)</label>
                <textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Order</label>
                <input type="number" value={editing.order_index ?? 0} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
                Show on website
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
