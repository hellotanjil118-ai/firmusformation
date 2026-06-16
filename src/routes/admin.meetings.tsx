import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, Calendar, Video, MapPin, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/meetings")({
  head: () => ({ meta: [{ title: "Meetings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminMeetings,
});

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  meeting_type: string;
  scheduled_at: string;
  duration_min: number;
  meeting_url: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  client_id: string | null;
  clients: { name: string; email: string } | null;
};

type Client = { id: string; name: string; email: string };

const TYPES = ["consultation", "client", "team", "internal"];
const STATUSES = ["scheduled", "completed", "cancelled", "no_show"];
const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-zinc-500/10 text-zinc-600",
  no_show: "bg-red-500/10 text-red-600",
};

function AdminMeetings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Meeting[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const [form, setForm] = useState({
    title: "",
    description: "",
    meeting_type: "consultation",
    scheduled_at: "",
    duration_min: 30,
    meeting_url: "",
    location: "",
    client_id: "",
  });

  const load = async () => {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase
        .from("meetings")
        .select("*,clients(name,email)")
        .order("scheduled_at", { ascending: false }),
      supabase.from("clients").select("id,name,email").order("name"),
    ]);
    setRows((m as unknown as Meeting[]) ?? []);
    setClients((c as Client[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!form.title || !form.scheduled_at || !user) return;
    const { error } = await supabase.from("meetings").insert({
      title: form.title,
      description: form.description || null,
      meeting_type: form.meeting_type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_min: form.duration_min,
      meeting_url: form.meeting_url || null,
      location: form.location || null,
      client_id: form.client_id || null,
      organizer_id: user.id,
    });
    if (!error) {
      setShowNew(false);
      setForm({ title: "", description: "", meeting_type: "consultation", scheduled_at: "", duration_min: 30, meeting_url: "", location: "", client_id: "" });
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("meetings").update({ status }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    await supabase.from("meetings").delete().eq("id", id);
    load();
  };

  const now = Date.now();
  const filtered = rows.filter((r) => {
    const t = new Date(r.scheduled_at).getTime();
    if (filter === "upcoming") return t >= now - 1000 * 60 * 60;
    if (filter === "past") return t < now - 1000 * 60 * 60;
    return true;
  });

  const upcoming = rows.filter((r) => new Date(r.scheduled_at).getTime() >= now).length;
  const todayCount = rows.filter((r) => new Date(r.scheduled_at).toDateString() === new Date().toDateString()).length;

  return (
    <AdminShell title="Meetings" subtitle="Consultations, client calls, and team meetings">
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Stat label="Today" value={todayCount} icon={<Calendar size={16} />} />
        <Stat label="Upcoming" value={upcoming} icon={<Video size={16} />} />
        <Stat label="Total scheduled" value={rows.length} icon={<Calendar size={16} />} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border bg-card p-1 text-xs">
          {(["upcoming", "past", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={14} /> New meeting
        </button>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-muted-foreground" />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No meetings in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const dt = new Date(m.scheduled_at);
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-primary/10 text-center">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">{dt.toLocaleString("default", { month: "short" })}</div>
                      <div className="font-display text-xl leading-none">{dt.getDate()}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base">{m.title}</h3>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">{m.meeting_type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_COLOR[m.status] ?? ""}`}>{m.status.replace("_", " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dt.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })} · {m.duration_min} min
                      {m.clients && <> · with <span className="text-foreground">{m.clients.name}</span></>}
                    </p>
                    {m.description && <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {m.meeting_url && (
                        <a href={m.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Video size={12} /> Join link
                        </a>
                      )}
                      {m.location && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin size={12} /> {m.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.status}
                      onChange={(e) => updateStatus(m.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1.5 text-xs capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                    <button onClick={() => remove(m.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">New meeting</h2>
              <button onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title">
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="Onboarding call with Acme" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value })} className="input capitalize">
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Duration (min)">
                  <input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 30 })} className="input" />
                </Field>
              </div>
              <Field label="When">
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="input" />
              </Field>
              <Field label="Client (optional)">
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="input">
                  <option value="">— None —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </Field>
              <Field label="Meeting URL (Zoom / Google Meet)">
                <input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} className="input" placeholder="https://meet.google.com/..." />
              </Field>
              <Field label="Location (optional)">
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" />
              </Field>
              <button onClick={create} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Schedule meeting
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input { width: 100%; border-radius: 0.375rem; border: 1px solid hsl(var(--input)); background: hsl(var(--background)); padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </AdminShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className="font-display text-2xl">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
