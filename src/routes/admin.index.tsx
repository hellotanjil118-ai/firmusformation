import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  Users,
  Inbox,
  ClipboardList,
  TrendingUp,
  LifeBuoy,
  Activity,
  Trophy,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Executive Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: DashboardPage,
});

type Order = { id: string; price: number; status: string; created_at: string; package_name: string; client_id: string };
type Lead = { id: string; status: string; service: string | null; value: number | null; created_at: string };

const PIPELINE_STAGES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const STAGE_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#60a5fa",
  qualified: "#a78bfa",
  proposal: "#f59e0b",
  negotiation: "#fb923c",
  won: "#10b981",
  lost: "#ef4444",
};

function DashboardPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [clientCount, setClientCount] = useState<number>(0);
  const [openTickets, setOpenTickets] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const [o, l, c, t] = await Promise.all([
        supabase.from("orders").select("id, price, status, created_at, package_name, client_id").order("created_at", { ascending: false }),
        supabase.from("leads").select("id, status, service, value, created_at").order("created_at", { ascending: false }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "closed"),
      ]);
      setOrders((o.data as Order[]) ?? []);
      setLeads((l.data as Lead[]) ?? []);
      setClientCount(c.count ?? 0);
      setOpenTickets(t.count ?? 0);
    })();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidOrders = orders?.filter((o) => o.status === "completed" || o.status === "paid") ?? [];
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.price ?? 0), 0);
    const monthRevenue = paidOrders
      .filter((o) => new Date(o.created_at) >= monthStart)
      .reduce((s, o) => s + Number(o.price ?? 0), 0);
    const openOrders = orders?.filter((o) => !["completed", "cancelled"].includes(o.status)).length ?? 0;
    const newLeads = leads?.filter((l) => l.status === "new").length ?? 0;
    const wonLeads = leads?.filter((l) => l.status === "won").length ?? 0;
    const totalLeads = leads?.length ?? 0;
    const conversion = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const pipelineValue = leads
      ?.filter((l) => !["won", "lost"].includes(l.status))
      .reduce((s, l) => s + Number(l.value ?? 0), 0) ?? 0;
    return { totalRevenue, monthRevenue, openOrders, newLeads, conversion, pipelineValue };
  }, [orders, leads]);

  const revenueSeries = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, 0);
    }
    (orders ?? [])
      .filter((o) => o.status === "completed" || o.status === "paid")
      .forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(o.price ?? 0));
      });
    return Array.from(map.entries()).map(([k, v]) => ({
      month: new Date(k + "-01").toLocaleDateString("en", { month: "short" }),
      revenue: v,
    }));
  }, [orders]);

  const funnelData = useMemo(
    () =>
      PIPELINE_STAGES.map((s) => ({
        stage: s,
        count: leads?.filter((l) => l.status === s).length ?? 0,
      })),
    [leads]
  );

  const servicePerf = useMemo(() => {
    const map = new Map<string, number>();
    (orders ?? []).forEach((o) => {
      map.set(o.package_name, (map.get(o.package_name) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orders]);

  const PIE_COLORS = ["#064e3b", "#0d7a5f", "#c9a84c", "#a78bfa", "#60a5fa", "#fb923c"];

  return (
    <AdminShell title="Executive Dashboard" subtitle="Real-time view of revenue, pipeline, and operations">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={DollarSign} label="Total Revenue" value={`$${metrics.totalRevenue.toLocaleString()}`} accent="text-emerald-500" />
        <Kpi icon={TrendingUp} label="This Month" value={`$${metrics.monthRevenue.toLocaleString()}`} accent="text-emerald-500" />
        <Kpi icon={Users} label="Active Clients" value={clientCount.toString()} />
        <Kpi icon={Inbox} label="New Leads" value={metrics.newLeads.toString()} accent="text-amber-500" />
        <Kpi icon={Trophy} label="Conversion" value={`${metrics.conversion}%`} accent="text-emerald-500" />
        <Kpi icon={ClipboardList} label="Open Orders" value={metrics.openOrders.toString()} />
        <Kpi icon={Activity} label="Pipeline Value" value={`$${Number(metrics.pipelineValue).toLocaleString()}`} accent="text-amber-500" />
        <Kpi icon={LifeBuoy} label="Open Tickets" value={openTickets.toString()} />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">Revenue (12 months)</h3>
              <p className="text-xs text-muted-foreground">Completed and paid orders</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d7a5f" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d7a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#0d7a5f" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="font-display text-lg">Service Mix</h3>
            <p className="text-xs text-muted-foreground">Top services by order count</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={servicePerf} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                  {servicePerf.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funnel + recent */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg">Lead Funnel</h3>
              <p className="text-xs text-muted-foreground">Leads at each pipeline stage</p>
            </div>
            <Link to="/admin/leads" className="text-xs text-primary hover:underline flex items-center gap-1">
              Open pipeline <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnelData.map((d, i) => (
                    <Cell key={i} fill={STAGE_COLORS[d.stage]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-lg">Recent Orders</h3>
          <div className="space-y-3">
            {(orders ?? []).slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to="/admin/orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-primary/50 hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{o.package_name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm">${Number(o.price).toLocaleString()}</div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase">{o.status}</span>
                </div>
              </Link>
            ))}
            {orders && orders.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No orders yet
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon size={16} className={accent ?? "text-muted-foreground"} />
      </div>
      <div className="mt-2 font-display text-2xl">{value}</div>
    </div>
  );
}
