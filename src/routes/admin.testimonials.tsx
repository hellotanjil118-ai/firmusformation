import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, X, Star } from "lucide-react";

export const Route = createFileRoute("/admin/testimonials")({
  head: () => ({ meta: [{ title: "Admin — Testimonials" }, { name: "robots", content: "noindex" }] }),
  component: TestimonialsAdmin,
});

type T = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
  published: boolean;
  order_index: number;
};

const empty: Omit<T, "id"> = { name: "", role: "", company: "", content: "", rating: 5, avatar_url: "", published: true, order_index: 0 };

function TestimonialsAdmin() {
  const [items, setItems] = useState<T[] | null>(null);
  const [editing, setEditing] = useState<Partial<T> | null>(null);

  const load = async () => {
    const { data } = await supabase.from("testimonials").select("*").order("order_index").order("created_at", { ascending: false });
    setItems((data as T[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.content) return;
    const payload = {
      name: editing.name,
      role: editing.role || null,
      company: editing.company || null,
      content: editing.content,
      rating: editing.rating ?? 5,
      avatar_url: editing.avatar_url || null,
      published: !!editing.published,
      order_index: editing.order_index ?? 0,
    };
    if (editing.id) await supabase.from("testimonials").update(payload).eq("id", editing.id);
    else await supabase.from("testimonials").insert(payload);
    setEditing(null);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    load();
  };

  return (
    <AdminShell title="Testimonials">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Testimonial
        </button>
      </div>

      {items === null ? <Loader2 className="animate-spin" /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No testimonials yet.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{t.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${t.published ? "bg-gold/20 text-gold" : "bg-secondary text-muted-foreground"}`}>
                      {t.published ? "Live" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.role}{t.company && ` · ${t.company}`}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={12} className="fill-gold text-gold" />)}
                </div>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">"{t.content}"</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(t)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
                <button onClick={() => remove(t.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit" : "New"} Testimonial</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name" value={editing.name || ""} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Role" value={editing.role || ""} onChange={(v) => setEditing({ ...editing, role: v })} />
              <Field label="Company" value={editing.company || ""} onChange={(v) => setEditing({ ...editing, company: v })} />
              <Field label="Avatar URL" value={editing.avatar_url || ""} onChange={(v) => setEditing({ ...editing, avatar_url: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium">Quote</label>
                <textarea value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Rating (1-5)</label>
                  <input type="number" min={1} max={5} value={editing.rating ?? 5} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Order</label>
                  <input type="number" value={editing.order_index ?? 0} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
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
