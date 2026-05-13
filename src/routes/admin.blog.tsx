import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Admin — Blog" }, { name: "robots", content: "noindex" }] }),
  component: BlogAdmin,
});

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
};

const empty: Omit<Post, "id"> = { slug: "", title: "", excerpt: "", content: "", cover_image: "", published: false, published_at: null };

function BlogAdmin() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title || !editing.slug) return;
    setSaving(true);
    const payload = {
      slug: editing.slug,
      title: editing.title,
      excerpt: editing.excerpt || null,
      content: editing.content || "",
      cover_image: editing.cover_image || null,
      published: !!editing.published,
      published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
    };
    if (editing.id) {
      await supabase.from("blog_posts").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("blog_posts").insert(payload);
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    load();
  };

  return (
    <AdminShell title="Blog Posts">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          <Plus size={14} /> New Post
        </button>
      </div>

      {posts === null ? <Loader2 className="animate-spin" /> : (
        <div className="space-y-2">
          {posts.length === 0 && <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No posts yet.</div>}
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{p.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-gold/20 text-gold" : "bg-secondary text-muted-foreground"}`}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">/{p.slug}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
                <button onClick={() => remove(p.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing.id ? "Edit Post" : "New Post"}</h2>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Input label="Title" value={editing.title || ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <Input label="Slug (URL)" value={editing.slug || ""} onChange={(v) => setEditing({ ...editing, slug: v.toLowerCase().replace(/\s+/g, "-") })} />
              <Input label="Cover image URL" value={editing.cover_image || ""} onChange={(v) => setEditing({ ...editing, cover_image: v })} />
              <Input label="Excerpt" value={editing.excerpt || ""} onChange={(v) => setEditing({ ...editing, excerpt: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium">Content (Markdown / HTML)</label>
                <textarea
                  value={editing.content || ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={12}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
                Publish
              </label>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}
