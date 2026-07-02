import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Megaphone,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  Pencil,
  Trash2,
  X,
  Loader2,
  Play,
  Pause,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/marketing")({
  head: () => ({ meta: [{ title: "Admin — Marketing" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number;
  spend: number;
  start_date: string | null;
  end_date: string | null;
  source_tag: string | null;
  notes: string | null;
  created_at: string;
};

type Lead = { id: string; source: string | null; status: string; value: number | null; created_at: string };

const CHANNELS = [
  { id: "google_ads", label: "Google Ads" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "seo", label: "SEO" },
  { id: "email", label: "Email" },
  { id: "social", label: "Social" },
  { id: "referral", label: "Referral" },
  { id: "other", label: "Other" },
];

const STATUSES = [
  { id: "draft", label: "Draft", tone: "bg-secondary text-muted-foreground" },
  { id: "active", label: "Active", tone: "bg-green-500/15 text-green-400" },
  { id: "paused", label: "Paused", tone: "bg-amber-500/15 text-amber-400" },
  { id: "completed", label: "Completed", tone: "bg-blue-500/15 text-blue-400" },
];

const PIE_COLORS = ["#6366f1", "#ec4899", "#22c55e", "#f59e0b", "#3b82f6", "#a855f7", "#94a3b8"];

function Page() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"campaigns" | "assets">("campaigns");

  const load = async () => {
    setLoading(true);
    const [c, l] = await Promise.all([
      supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id,source,status,value,created_at"),
    ]);
    setCampaigns((c.data as Campaign[]) ?? []);
    setLeads((l.data as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const attribution = useMemo(() => {
    const map = new Map<string, { leads: number; won: number; revenue: number }>();
    for (const l of leads) {
      const key = (l.source ?? "").toLowerCase().trim();
      if (!key) continue;
      const cur = map.get(key) ?? { leads: 0, won: 0, revenue: 0 };
      cur.leads += 1;
      if (l.status === "won") {
        cur.won += 1;
        cur.revenue += Number(l.value ?? 0);
      }
      map.set(key, cur);
    }
    return map;
  }, [leads]);

  const enriched = useMemo(() => {
    return campaigns.map((c) => {
      const tag = (c.source_tag ?? c.name).toLowerCase().trim();
      const attr = attribution.get(tag) ?? { leads: 0, won: 0, revenue: 0 };
      const roas = c.spend > 0 ? attr.revenue / Number(c.spend) : 0;
      const cpl = attr.leads > 0 ? Number(c.spend) / attr.leads : 0;
      return { ...c, ...attr, roas, cpl };
    });
  }, [campaigns, attribution]);

  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (q && !`${c.name} ${c.source_tag ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [enriched, q, channelFilter, statusFilter]);

  const kpis = useMemo(() => {
    const active = enriched.filter((c) => c.status === "active").length;
    const budget = enriched.reduce((s, c) => s + Number(c.budget), 0);
    const spend = enriched.reduce((s, c) => s + Number(c.spend), 0);
    const revenue = enriched.reduce((s, c) => s + c.revenue, 0);
    const leadsCount = enriched.reduce((s, c) => s + c.leads, 0);
    const roas = spend > 0 ? revenue / spend : 0;
    return { active, budget, spend, revenue, leads: leadsCount, roas };
  }, [enriched]);

  const channelChart = useMemo(() => {
    const by = new Map<string, { spend: number; revenue: number; leads: number }>();
    for (const c of enriched) {
      const cur = by.get(c.channel) ?? { spend: 0, revenue: 0, leads: 0 };
      cur.spend += Number(c.spend);
      cur.revenue += c.revenue;
      cur.leads += c.leads;
      by.set(c.channel, cur);
    }
    return [...by.entries()].map(([channel, v]) => ({
      channel: CHANNELS.find((x) => x.id === channel)?.label ?? channel,
      ...v,
    }));
  }, [enriched]);

  const statusPie = useMemo(() => {
    const by = new Map<string, number>();
    for (const c of enriched) by.set(c.status, (by.get(c.status) ?? 0) + 1);
    return [...by.entries()].map(([status, value]) => ({
      name: STATUSES.find((s) => s.id === status)?.label ?? status,
      value,
    }));
  }, [enriched]);

  const remove = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Campaign deleted");
    load();
  };

  const quickStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("marketing_campaigns").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminShell title="Marketing Center" subtitle="Campaigns · Attribution · Assets library">
      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-1">
        {(["campaigns", "assets"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "campaigns" && (<>
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Megaphone} label="Active campaigns" value={kpis.active.toString()} sub={`${enriched.length} total`} />
        <Kpi icon={DollarSign} label="Total spend" value={`$${kpis.spend.toLocaleString()}`} sub={`of $${kpis.budget.toLocaleString()} budget`} />
        <Kpi icon={Users} label="Attributed leads" value={kpis.leads.toString()} sub={`from campaign sources`} />
        <Kpi icon={TrendingUp} label="Blended ROAS" value={`${kpis.roas.toFixed(2)}x`} sub={`$${kpis.revenue.toLocaleString()} revenue`} tone={kpis.roas >= 1 ? "text-green-400" : "text-amber-400"} />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-3 font-display text-sm uppercase tracking-wide text-muted-foreground">Spend vs Revenue by Channel</h3>
          {channelChart.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={channelChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="channel" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="spend" fill="#f59e0b" name="Spend" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-sm uppercase tracking-wide text-muted-foreground">Status Mix</h3>
          {statusPie.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 11 }}>
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search campaigns…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-2 text-sm">
          <option value="all">All channels</option>
          {CHANNELS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-2 text-sm">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <Plus size={14} /> New campaign
        </button>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="grid place-items-center p-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No campaigns yet. Create your first to start tracking spend and attribution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Budget</th>
                  <th className="px-4 py-3 text-right">Spend</th>
                  <th className="px-4 py-3 text-right">Leads</th>
                  <th className="px-4 py-3 text-right">Won</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">CPL</th>
                  <th className="px-4 py-3 text-right">ROAS</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const st = STATUSES.find((s) => s.id === c.status);
                  const ch = CHANNELS.find((x) => x.id === c.channel);
                  return (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.name}</div>
                        {c.source_tag && (
                          <div className="text-xs text-muted-foreground">tag: {c.source_tag}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ch?.label ?? c.channel}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${st?.tone}`}>{st?.label ?? c.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">${Number(c.budget).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">${Number(c.spend).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{c.leads}</td>
                      <td className="px-4 py-3 text-right">{c.won}</td>
                      <td className="px-4 py-3 text-right">${c.revenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "—"}</td>
                      <td className={`px-4 py-3 text-right font-medium ${c.roas >= 1 ? "text-green-400" : c.roas > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {c.spend > 0 ? `${c.roas.toFixed(2)}x` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.status !== "active" && (
                            <button onClick={() => quickStatus(c.id, "active")} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-green-400" title="Activate">
                              <Play size={13} />
                            </button>
                          )}
                          {c.status === "active" && (
                            <button onClick={() => quickStatus(c.id, "paused")} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-amber-400" title="Pause">
                              <Pause size={13} />
                            </button>
                          )}
                          {c.status !== "completed" && (
                            <button onClick={() => quickStatus(c.id, "completed")} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-blue-400" title="Mark completed">
                              <CheckCircle2 size={13} />
                            </button>
                          )}
                          <button onClick={() => { setEditing(c); setShowForm(true); }} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => remove(c.id)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>)}

      {tab === "assets" && (
        <AssetsPanel campaigns={campaigns} userId={user?.id ?? null} />
      )}



      {showForm && (
        <CampaignForm
          initial={editing}
          userId={user?.id ?? null}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Megaphone;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon size={14} /> {label}
      </div>
      <div className={`mt-2 font-display text-2xl ${tone ?? ""}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-[240px] place-items-center text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <Target size={24} className="opacity-40" />
        No data yet
      </div>
    </div>
  );
}

function CampaignForm({
  initial,
  userId,
  onClose,
  onSaved,
}: {
  initial: Campaign | null;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    channel: initial?.channel ?? "google_ads",
    status: initial?.status ?? "draft",
    budget: initial?.budget?.toString() ?? "0",
    spend: initial?.spend?.toString() ?? "0",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    source_tag: initial?.source_tag ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      channel: form.channel,
      status: form.status,
      budget: Number(form.budget) || 0,
      spend: Number(form.spend) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      source_tag: form.source_tag.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = initial
      ? await supabase.from("marketing_campaigns").update(payload).eq("id", initial.id)
      : await supabase.from("marketing_campaigns").insert({ ...payload, created_by: userId });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Campaign updated" : "Campaign created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg">{initial ? "Edit campaign" : "New campaign"}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budget ($)">
              <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="Spend ($)">
              <input type="number" min="0" step="0.01" value={form.spend} onChange={(e) => setForm({ ...form, spend: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="End date">
              <input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Attribution tag" hint="Match this to the lead 'source' field. Defaults to campaign name if empty.">
            <input value={form.source_tag ?? ""} onChange={(e) => setForm({ ...form, source_tag: e.target.value })} placeholder="e.g. google-brand-q1" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Notes">
            <textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
    </label>
  );
}
