import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  History,
  Search,
  Loader2,
  ArrowRight,
  UserPlus,
  UserMinus,
  Shuffle,
  Activity,
  Download,
  ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/admin/employees_/audit")({
  head: () => ({ meta: [{ title: "Employee Audit Log — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type AuditRow = {
  id: string;
  employee_id: string | null;
  employee_name: string | null;
  from_department_id: string | null;
  to_department_id: string | null;
  from_department_name: string | null;
  to_department_name: string | null;
  from_status: string | null;
  to_status: string | null;
  changed_by: string | null;
  changed_by_email: string | null;
  action: string;
  created_at: string;
};

const ACTION_META: Record<string, { label: string; icon: typeof Activity; className: string }> = {
  assign: { label: "Assigned", icon: UserPlus, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  unassign: { label: "Unassigned", icon: UserMinus, className: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  reassign: { label: "Reassigned", icon: Shuffle, className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
  status_change: { label: "Status changed", icon: Activity, className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
};

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Page() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [range, setRange] = useState<string>("all");
  const [limit, setLimit] = useState(200);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("employee_assignment_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "24h" ? now - 86400000 : range === "7d" ? now - 7 * 86400000 : range === "30d" ? now - 30 * 86400000 : 0;
    return rows.filter((r) => {
      if (actionFilter !== "all" && r.action !== actionFilter) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      if (q) {
        const hay = `${r.employee_name ?? ""} ${r.changed_by_email ?? ""} ${r.from_department_name ?? ""} ${
          r.to_department_name ?? ""
        } ${r.from_status ?? ""} ${r.to_status ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, actionFilter, range, q]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => (counts[r.action] = (counts[r.action] ?? 0) + 1));
    const actors = new Set(rows.map((r) => r.changed_by_email).filter(Boolean));
    return { total: rows.length, actors: actors.size, ...counts };
  }, [rows]);

  function exportCsv() {
    const header = [
      "timestamp",
      "action",
      "employee",
      "from_department",
      "to_department",
      "from_status",
      "to_status",
      "actor_email",
    ];
    const csv = [
      header.join(","),
      ...filtered.map((r) =>
        [
          r.created_at,
          r.action,
          r.employee_name ?? "",
          r.from_department_name ?? "",
          r.to_department_name ?? "",
          r.from_status ?? "",
          r.to_status ?? "",
          r.changed_by_email ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell title="Employee Audit Log" subtitle="Every assignment and status change, with actor and timestamp">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to employees
        </Link>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total events" value={stats.total} />
        <Stat label="Assigned" value={stats.assign ?? 0} />
        <Stat label="Reassigned" value={stats.reassign ?? 0} />
        <Stat label="Status changes" value={stats.status_change ?? 0} />
        <Stat label="Actors" value={stats.actors} />
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employee, actor, department…"
            className="w-72 rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All actions</option>
          <option value="assign">Assigned</option>
          <option value="unassign">Unassigned</option>
          <option value="reassign">Reassigned</option>
          <option value="status_change">Status change</option>
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All time</option>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={100}>Load 100</option>
          <option value={200}>Load 200</option>
          <option value={500}>Load 500</option>
          <option value={1000}>Load 1000</option>
        </select>
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </p>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <History className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No audit entries match.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ol className="divide-y divide-border">
            {filtered.map((r) => {
              const meta = ACTION_META[r.action] ?? {
                label: r.action,
                icon: Activity,
                className: "bg-secondary text-foreground border-border",
              };
              const Icon = meta.icon;
              return (
                <li key={r.id} className="flex gap-4 p-4 hover:bg-secondary/30">
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${meta.className}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{r.employee_name ?? "Unknown employee"}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {r.action === "status_change" ? (
                        <>
                          <Chip>{r.from_status ?? "—"}</Chip>
                          <ArrowRight size={12} />
                          <Chip highlight>{r.to_status ?? "—"}</Chip>
                        </>
                      ) : (
                        <>
                          <Chip>{r.from_department_name ?? "Unassigned"}</Chip>
                          <ArrowRight size={12} />
                          <Chip highlight>{r.to_department_name ?? "Unassigned"}</Chip>
                        </>
                      )}
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      by <span className="text-foreground">{r.changed_by_email ?? "system"}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>{relative(r.created_at)}</div>
                    <div className="mt-0.5 text-[10px]">{fmt(r.created_at)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="font-display text-xl font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-xs capitalize ${
        highlight ? "border-primary/30 bg-primary/10 text-foreground" : "border-border bg-secondary/40"
      }`}
    >
      {String(children).replace(/_/g, " ")}
    </span>
  );
}
