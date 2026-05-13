import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Phone, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Leads" }, { name: "robots", content: "noindex" }] }),
  component: LeadsPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  created_at: string;
};

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    load();
  };

  const filtered = leads?.filter((l) => filter === "all" || l.status === filter) ?? [];
  const counts = {
    all: leads?.length ?? 0,
    new: leads?.filter((l) => l.status === "new").length ?? 0,
    contacted: leads?.filter((l) => l.status === "contacted").length ?? 0,
    closed: leads?.filter((l) => l.status === "closed").length ?? 0,
  };

  return (
    <AdminShell title="Leads">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "new", "contacted", "closed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {leads === null ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No leads here yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg">{l.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      l.status === "new" ? "bg-gold/20 text-gold" :
                      l.status === "contacted" ? "bg-primary/20 text-primary-foreground" :
                      "bg-secondary text-muted-foreground"
                    }`}>{l.status}</span>
                    {l.service && <span className="text-xs text-muted-foreground">· {l.service}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a href={`mailto:${l.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail size={12} /> {l.email}</a>
                    {l.phone && <a href={`tel:${l.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone size={12} /> {l.phone}</a>}
                    <span>{new Date(l.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={l.status}
                    onChange={(e) => updateStatus(l.id, e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => remove(l.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{l.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
