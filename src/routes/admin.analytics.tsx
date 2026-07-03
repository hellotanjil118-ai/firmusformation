import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { DollarSign, Users, TrendingUp, Target, Loader2, Briefcase, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Admin — Analytics" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Row = Record<string, any>;

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function Page() {
  const [invoices, setInvoices] = useState<Row[] | null>(null);
  const [leads, setLeads] = useState<Row[] | null>(null);
  const [clients, setClients] = useState<Row[] | null>(null);
  const [orders, setOrders] = useState<Row[] | null>(null);
  const [campaigns, setCampaigns] = useState<Row[] | null>(null);
  const [range, setRange] = useState<"30" | "90" | "365">("90");

  useEffect(() => {
    (async () => {
      const [inv, ld, cl, or, ca] = await Promise.all([
        supabase.from("invoices").select("status,total,currency,issue_date,paid_at,created_at"),
        supabase.from("leads").select("status,value,source,created_at"),
        supabase.from("clients").select("status,created_at"),
        supabase.from("orders").select("status,price,package_name,created_at"),
        supabase.from("marketing_campaigns").select("name,channel,status,budget,spend"),
      ]);
      setInvoices(inv.data ?? []);
      setLeads(ld.data ?? []);
      setClients(cl.data ?? []);
      setOrders(or.data ?? []);
      setCampaigns(ca.data ?? []);
    })();
  }, []);

  const loading = !invoices || !leads || !clients || !orders || !campaigns;

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(range));
    return d;
  }, [range]);

  const stats = useMemo(() => {
    if (loading) return null;
    const paidInRange = invoices!.filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= cutoff);
    const revenue = paidInRange.reduce((s, i) => s + Number(i.total ?? 0), 0);
    const outstanding = invoices!.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total ?? 0), 0);
    const leadsInRange = leads!.filter((l) => new Date(l.created_at) >= cutoff);
    const newClients = clients!.filter((c) => new Date(c.created_at) >= cutoff).length;
    const wonLeads = leadsInRange.filter((l) => l.status === "won").length;
    const conversion = leadsInRange.length ? (wonLeads / leadsInRange.length) * 100 : 0;
    const marketingSpend = campaigns!.reduce((s, c) => s + Number(c.spend ?? 0), 0);
    const roas = marketingSpend ? revenue / marketingSpend : 0;
    return { revenue, outstanding, leadsCount: leadsInRange.length, newClients, conversion, marketingSpend, roas };
  }, [loading, invoices, leads, clients, campaigns, cutoff]);

  const revenueSeries = useMemo(() => {
    if (loading) return [];
    const buckets = new Map<string, { label: string; revenue: number; leads: number }>();
    const days = Number(range);
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.set(key, { label, revenue: 0, leads: 0 });
    }
    invoices!.forEach((i) => {
      if (i.status !== "paid" || !i.paid_at) return;
      const key = new Date(i.paid_at).toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.revenue += Number(i.total ?? 0);
    });
    leads!.forEach((l) => {
      const key = new Date(l.created_at).toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.leads += 1;
    });
    // For 365d, bucket by month
    if (Number(range) === 365) {
      const monthly = new Map<string, { label: string; revenue: number; leads: number }>();
      Array.from(buckets.values()).forEach((b) => {
        // no-op: skip flattening
      });
      const months = new Map<string, { label: string; revenue: number; leads: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        months.set(key, { label: d.toLocaleDateString("en-US", { month: "short" }), revenue: 0, leads: 0 });
      }
      invoices!.forEach((i) => {
        if (i.status !== "paid" || !i.paid_at) return;
        const d = new Date(i.paid_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const m = months.get(key);
        if (m) m.revenue += Number(i.total ?? 0);
      });
      leads!.forEach((l) => {
        const d = new Date(l.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const m = months.get(key);
        if (m) m.leads += 1;
      });
      return Array.from(months.values());
    }
    return Array.from(buckets.values());
  }, [loading, invoices, leads, range]);

  const leadsBySource = useMemo(() => {
    if (loading) return [];
    const map = new Map<string, number>();
    leads!.filter((l) => new Date(l.created_at) >= cutoff).forEach((l) => {
      const k = l.source || "Direct";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [loading, leads, cutoff]);

  const funnel = useMemo(() => {
    if (loading) return [];
    const inRange = leads!.filter((l) => new Date(l.created_at) >= cutoff);
    const byStatus = (s: string) => inRange.filter((l) => l.status === s).length;
    return [
      { stage: "New", count: byStatus("new") },
      { stage: "Contacted", count: byStatus("contacted") },
      { stage: "Qualified", count: byStatus("qualified") },
      { stage: "Proposal", count: byStatus("proposal") },
      { stage: "Won", count: byStatus("won") },
    ];
  }, [loading, leads, cutoff]);

  const channelPerf = useMemo(() => {
    if (loading) return [];
    return campaigns!.map((c) => ({
      name: c.name,
      channel: c.channel,
      spend: Number(c.spend ?? 0),
      budget: Number(c.budget ?? 0),
    })).sort((a, b) => b.spend - a.spend).slice(0, 8);
  }, [loading, campaigns]);

  const topPackages = useMemo(() => {
    if (loading) return [];
    const map = new Map<string, { count: number; revenue: number }>();
    orders!.forEach((o) => {
      const k = o.package_name || "Unnamed";
      const cur = map.get(k) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(o.price ?? 0);
      map.set(k, cur);
    });
    return Array.from(map, ([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [loading, orders]);

  return (
    <AdminShell title="Analytics Center" subtitle="Real-time business intelligence">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Live from your database</div>
        <div className="inline-flex rounded-md border border-border bg-card p-1 text-xs">
          {(["30", "90", "365"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded px-3 py-1.5 ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {r === "365" ? "1y" : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} tone="emerald" />
            <Kpi label="Outstanding" value={`$${stats.outstanding.toLocaleString()}`} icon={TrendingUp} tone="blue" />
            <Kpi label="New leads" value={String(stats.leadsCount)} icon={Users} tone="indigo" />
            <Kpi label="Conversion" value={`${stats.conversion.toFixed(1)}%`} icon={Target} tone="amber" />
            <Kpi label="New clients" value={String(stats.newClients)} icon={Briefcase} tone="emerald" />
            <Kpi label="Marketing spend" value={`$${stats.marketingSpend.toLocaleString()}`} icon={ShoppingCart} tone="red" />
            <Kpi label="Blended ROAS" value={`${stats.roas.toFixed(2)}x`} icon={TrendingUp} tone="indigo" />
            <Kpi label="Avg deal" value={`$${stats.newClients ? (stats.revenue / stats.newClients).toFixed(0) : 0}`} icon={DollarSign} tone="amber" />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Chart title="Revenue & Leads Trend">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="l" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Chart>

            <Chart title="Leads by Source">
              {leadsBySource.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={leadsBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={{ fontSize: 11 }}>
                      {leadsBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Chart>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Chart title="Sales Funnel">
              {funnel.every((f) => f.count === 0) ? <Empty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Chart>

            <Chart title="Marketing: Spend vs Budget">
              {channelPerf.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={channelPerf}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="budget" fill="#94a3b8" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spend" fill="#ef4444" name="Spend" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Chart>
          </div>

          <Chart title="Top Order Packages by Revenue">
            {topPackages.length === 0 ? <Empty /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Package</th>
                      <th className="px-3 py-2">Orders</th>
                      <th className="px-3 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPackages.map((p) => (
                      <tr key={p.name} className="border-t border-border">
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.count}</td>
                        <td className="px-3 py-2 font-semibold">${p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Chart>
        </>
      )}
    </AdminShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    red: "text-red-600 bg-red-500/10",
    indigo: "text-indigo-600 bg-indigo-500/10",
    amber: "text-amber-600 bg-amber-500/10",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`rounded-lg p-1.5 ${tones[tone]}`}><Icon size={12} /></span>
      </div>
      <p className="mt-1.5 font-display text-xl">{value}</p>
    </div>
  );
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">No data yet</div>;
}
