import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building2, Globe, Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({ meta: [{ title: "Admin — CRM Pipeline" }, { name: "robots", content: "noindex" }] }),
  component: LeadsKanbanPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  service: string | null;
  source: string | null;
  status: string;
  value: number | null;
  message: string;
  created_at: string;
};

const STAGES: { id: string; label: string; color: string }[] = [
  { id: "new", label: "New Lead", color: "border-slate-400" },
  { id: "contacted", label: "Contacted", color: "border-blue-400" },
  { id: "qualified", label: "Qualified", color: "border-violet-400" },
  { id: "proposal", label: "Proposal Sent", color: "border-amber-400" },
  { id: "negotiation", label: "Negotiation", color: "border-orange-400" },
  { id: "won", label: "Won", color: "border-emerald-500" },
  { id: "lost", label: "Lost", color: "border-rose-500" },
];

function LeadsKanbanPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const moveLead = async (leadId: string, stage: string) => {
    const prev = leads;
    setLeads((cur) => cur?.map((l) => (l.id === leadId ? { ...l, status: stage } : l)) ?? null);
    const { error } = await supabase.from("leads").update({ status: stage }).eq("id", leadId);
    if (error) {
      setLeads(prev);
      toast.error("Could not move lead");
      return;
    }
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      kind: "stage_change",
      body: `Moved to ${stage}`,
    });
    toast.success(`Moved to ${stage}`);
  };

  const filtered = useMemo(
    () =>
      (leads ?? []).filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q)
        );
      }),
    [leads, search]
  );

  const totals = useMemo(() => {
    const t: Record<string, { count: number; value: number }> = {};
    STAGES.forEach((s) => (t[s.id] = { count: 0, value: 0 }));
    filtered.forEach((l) => {
      const k = STAGES.find((s) => s.id === l.status)?.id ?? "new";
      t[k].count += 1;
      t[k].value += Number(l.value ?? 0);
    });
    return t;
  }, [filtered]);

  return (
    <AdminShell title="Sales Pipeline" subtitle="Drag leads across stages to update their status">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company…"
            className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <Plus size={14} /> New Lead
        </button>
      </div>

      {leads === null ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => (
              <div
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragging) moveLead(dragging, stage.id);
                  setDragging(null);
                }}
                className={`w-72 shrink-0 rounded-xl border-t-2 ${stage.color} bg-[color:var(--surface)] p-3`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <div className="text-sm font-semibold">{stage.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {totals[stage.id].count} · ${totals[stage.id].value.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {filtered
                    .filter((l) => l.status === stage.id)
                    .map((l) => (
                      <Link
                        key={l.id}
                        to="/admin/leads/$id"
                        params={{ id: l.id }}
                        draggable
                        onDragStart={() => setDragging(l.id)}
                        onDragEnd={() => setDragging(null)}
                        className={`block cursor-grab rounded-lg border border-border bg-card p-3 text-sm transition hover:border-primary/50 hover:shadow-md ${
                          dragging === l.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{l.name}</div>
                            {l.company && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 size={10} /> {l.company}
                              </div>
                            )}
                          </div>
                          {l.value ? (
                            <div className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-600">
                              ${Number(l.value).toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                        {l.service && <div className="mt-2 text-xs text-muted-foreground">{l.service}</div>}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail size={10} /> {l.email.split("@")[0]}
                          </span>
                          {l.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} /> {l.phone}
                            </span>
                          )}
                          {l.country && (
                            <span className="flex items-center gap-1">
                              <Globe size={10} /> {l.country}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  {filtered.filter((l) => l.status === stage.id).length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <NewLeadModal onClose={() => setShowAdd(false)} onCreated={load} />}
    </AdminShell>
  );
}

function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    service: "",
    source: "manual",
    value: "",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("leads").insert({
      ...form,
      value: form.value ? Number(form.value) : 0,
      status: "new",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lead created");
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg space-y-3 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-xl">New Lead</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Field label="Service" value={form.service} onChange={(v) => setForm({ ...form, service: v })} />
          <Field label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
          <Field label="Deal Value ($)" type="number" value={form.value} onChange={(v) => setForm({ ...form, value: v })} />
        </div>
        <label className="block">
          <span className="text-xs text-muted-foreground">Notes</span>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-sm"
            rows={3}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
      />
    </label>
  );
}
