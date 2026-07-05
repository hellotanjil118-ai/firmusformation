import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen,
  Folder,
  FolderPlus,
  Upload,
  Loader2,
  Search,
  Trash2,
  Download,
  File as FileIcon,
  X,
  ChevronRight,
  Home,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({ meta: [{ title: "Documents — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  category: string | null;
  description: string | null;
  created_at: string;
};
type DocRow = {
  id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: number;
  tags: string[] | null;
  created_at: string;
};

const CATEGORIES = ["llc", "ein", "trademark", "bank", "contracts", "invoices", "employees", "other"];

function formatSize(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function Page() {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [current, setCurrent] = useState<string | null>(null); // parent folder id
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFolder, setShowFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const [f, d] = await Promise.all([
      supabase.from("document_folders").select("*").order("name"),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
    ]);
    setFolders((f.data ?? []) as FolderRow[]);
    setDocs((d.data ?? []) as DocRow[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const foldersHere = useMemo(
    () => folders.filter((f) => f.parent_id === current),
    [folders, current],
  );
  const docsHere = useMemo(() => {
    let list = docs.filter((d) => d.folder_id === current);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q) ||
          (d.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [docs, current, search]);

  const breadcrumb = useMemo(() => {
    const chain: FolderRow[] = [];
    let id: string | null = current;
    while (id) {
      const f = folders.find((x) => x.id === id);
      if (!f) break;
      chain.unshift(f);
      id = f.parent_id;
    }
    return chain;
  }, [current, folders]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    for (const file of Array.from(files)) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
      const path = `${current ?? "root"}/${crypto.randomUUID()}${ext ? "." + ext : ""}`;
      const up = await supabase.storage.from("documents").upload(path, file, { upsert: false });
      if (up.error) {
        alert("Upload failed: " + up.error.message);
        continue;
      }
      await supabase.from("documents").insert({
        folder_id: current,
        name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: u.user?.id ?? null,
      });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function download(doc: DocRow) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.storage_path, 300);
    if (error) return alert(error.message);
    window.open(data.signedUrl, "_blank");
  }

  async function removeDoc(doc: DocRow) {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    await supabase.storage.from("documents").remove([doc.storage_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    setDocs((p) => p.filter((d) => d.id !== doc.id));
  }

  async function removeFolder(f: FolderRow) {
    const hasChildren =
      folders.some((x) => x.parent_id === f.id) || docs.some((d) => d.folder_id === f.id);
    if (hasChildren) return alert("Folder not empty. Move or delete its contents first.");
    if (!confirm(`Delete folder "${f.name}"?`)) return;
    await supabase.from("document_folders").delete().eq("id", f.id);
    setFolders((p) => p.filter((x) => x.id !== f.id));
  }

  const stats = useMemo(() => {
    const totalBytes = docs.reduce((s, d) => s + (d.size_bytes ?? 0), 0);
    return { docs: docs.length, folders: folders.length, size: totalBytes };
  }, [docs, folders]);

  return (
    <AdminShell title="Document Management" subtitle="Centralized vault for the entire company">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Files</div>
          <div className="mt-1 font-display text-2xl">{stats.docs}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Folders</div>
          <div className="mt-1 font-display text-2xl">{stats.folders}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Storage used</div>
          <div className="mt-1 font-display text-2xl">{formatSize(stats.size)}</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCurrent(null)}
          className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Home size={12} /> Root
        </button>
        {breadcrumb.map((f) => (
          <div key={f.id} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-muted-foreground" />
            <button
              onClick={() => setCurrent(f.id)}
              className="rounded-md border border-border bg-card px-2 py-1 text-xs hover:text-primary"
            >
              {f.name}
            </button>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 rounded-md border border-border bg-background py-1.5 pl-7 pr-3 text-xs"
            />
          </div>
          <button
            onClick={() => setShowFolder(true)}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            <FolderPlus size={12} /> New folder
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-elegant disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {foldersHere.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Folders
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {foldersHere.map((f) => {
                  const count =
                    docs.filter((d) => d.folder_id === f.id).length +
                    folders.filter((x) => x.parent_id === f.id).length;
                  return (
                    <div
                      key={f.id}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/50"
                    >
                      <button
                        onClick={() => setCurrent(f.id)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <Folder size={20} className="text-primary" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{f.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {count} item{count === 1 ? "" : "s"}
                            {f.category ? ` · ${f.category}` : ""}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => removeFolder(f)}
                        className="text-muted-foreground opacity-0 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Files
            </h3>
            {docsHere.length === 0 ? (
              <div className="grid place-items-center rounded-lg border border-dashed border-border py-16 text-center">
                <FolderOpen size={32} className="mb-2 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">No files here</div>
                <div className="text-xs text-muted-foreground">Upload a file to get started</div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Size</th>
                      <th className="px-3 py-2 text-left">Uploaded</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsHere.map((d) => (
                      <tr key={d.id} className="border-t border-border hover:bg-secondary/30">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <FileIcon size={14} className="text-muted-foreground" />
                            <div>
                              <div className="font-medium">{d.name}</div>
                              {d.tags && d.tags.length > 0 && (
                                <div className="mt-0.5 flex gap-1">
                                  {d.tags.map((t) => (
                                    <span
                                      key={t}
                                      className="inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 text-[9px] text-muted-foreground"
                                    >
                                      <Tag size={8} /> {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{d.mime_type ?? "—"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{formatSize(d.size_bytes)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => download(d)}
                              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-primary"
                              aria-label="Download"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => removeDoc(d)}
                              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {showFolder && (
        <FolderForm
          parentId={current}
          onClose={() => setShowFolder(false)}
          onSaved={() => {
            setShowFolder(false);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

function FolderForm({
  parentId,
  onClose,
  onSaved,
}: {
  parentId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("document_folders").insert({
      name: name.trim(),
      parent_id: parentId,
      category: category || null,
      description: description.trim() || null,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg">New folder</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Name</div>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Category</div>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">— None —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-medium text-muted-foreground">Description</div>
            <textarea
              className={inputCls}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
