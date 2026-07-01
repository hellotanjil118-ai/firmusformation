import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  UserCog,
  Search,
  Plus,
  Loader2,
  Users,
  Wallet,
  TrendingUp,
  UserCheck,
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  BadgeDollarSign,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Department = { id: string; name: string; color: string | null };
type Employee = {
  id: string;
  user_id: string | null;
  department_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  employment_type: string;
  status: string;
  hourly_rate: number | null;
  monthly_salary: number | null;
  avatar_url: string | null;
  joined_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS = ["active", "on_leave", "suspended", "inactive"] as const;
const TYPES = ["full_time", "part_time", "contract", "intern"] as const;

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  on_leave: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  suspended: "bg-red-500/10 text-red-600 border-red-500/30",
  inactive: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
};

function money(n: number | null | undefined) {
  if (n == null) return "—";
  return "£" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Page() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: e }, { data: d }] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name,color").order("name"),
    ]);
    setEmps((e as Employee[]) ?? []);
    setDepts((d as Department[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const deptMap = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);

  const filtered = useMemo(() => {
    return emps.filter((e) => {
      if (deptFilter !== "all" && e.department_id !== deptFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q) {
        const hay = `${e.full_name} ${e.email ?? ""} ${e.title ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [emps, deptFilter, statusFilter, q]);

  const kpis = useMemo(() => {
    const active = emps.filter((e) => e.status === "active");
    const monthly = active.reduce((sum, e) => sum + Number(e.monthly_salary ?? 0), 0);
    const unassigned = emps.filter((e) => !e.department_id).length;
    return {
      total: emps.length,
      active: active.length,
      payroll: monthly,
      unassigned,
    };
  }, [emps]);

  const byDept = useMemo(() => {
    const map = new Map<string, { name: string; count: number; payroll: number; color: string }>();
    depts.forEach((d) =>
      map.set(d.id, { name: d.name, count: 0, payroll: 0, color: d.color ?? "#6366f1" }),
    );
    emps.forEach((e) => {
      if (!e.department_id) return;
      const row = map.get(e.department_id);
      if (!row) return;
      row.count += 1;
      row.payroll += Number(e.monthly_salary ?? 0);
    });
    return Array.from(map.values());
  }, [emps, depts]);

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    emps.forEach((e) => (counts[e.status] = (counts[e.status] ?? 0) + 1));
    return STATUS.map((s) => ({ name: s.replace("_", " "), value: counts[s] ?? 0 }));
  }, [emps]);

  async function updateEmp(id: string, patch: Partial<Employee>) {
    await supabase.from("employees").update(patch).eq("id", id);
    await load();
    if (selected?.id === id) setSelected({ ...selected, ...patch });
  }

  async function deleteEmp(id: string) {
    if (!confirm("Delete this employee record? This cannot be undone.")) return;
    await supabase.from("employees").delete().eq("id", id);
    setSelected(null);
    await load();
  }

  const STATUS_PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

  return (
    <AdminShell title="Employee Management" subtitle="Profiles · Payroll · Departments · Status">
      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Users} label="Total headcount" value={kpis.total.toString()} tint="from-indigo-500 to-blue-500" />
        <Kpi icon={UserCheck} label="Active" value={kpis.active.toString()} tint="from-emerald-500 to-teal-500" />
        <Kpi icon={Wallet} label="Monthly payroll" value={money(kpis.payroll)} tint="from-amber-500 to-orange-500" />
        <Kpi
          icon={TrendingUp}
          label="Unassigned"
          value={kpis.unassigned.toString()}
          tint="from-rose-500 to-pink-500"
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">Headcount by department</h3>
            <span className="text-xs text-muted-foreground">{depts.length} departments</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {byDept.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-semibold">Status mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={STATUS_PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {byStatus.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_PIE_COLORS[i] }} />
                <span className="capitalize text-muted-foreground">{s.name}</span>
                <span className="ml-auto font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, title…"
            className="w-64 rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All departments</option>
          <option value="">Unassigned</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {emps.length}
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          <Plus size={14} /> Add employee
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <UserCog className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No employees match your filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Salary</th>
                  <th className="p-3 text-left">Joined</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const dept = e.department_id ? deptMap.get(e.department_id) : null;
                  return (
                    <tr
                      key={e.id}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/30"
                      onClick={() => setSelected(e)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                            {initials(e.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{e.full_name}</div>
                            <div className="truncate text-xs text-muted-foreground">{e.email ?? "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{e.title ?? "—"}</td>
                      <td className="p-3">
                        {dept ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
                            style={{ borderColor: (dept.color ?? "#888") + "55", color: dept.color ?? undefined }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dept.color ?? "#888" }} />
                            {dept.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 text-xs capitalize text-muted-foreground">
                        {e.employment_type.replace("_", " ")}
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${STATUS_COLOR[e.status]}`}>
                          {e.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-xs">{money(e.monthly_salary)}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {e.joined_at ? new Date(e.joined_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEditing(e);
                            setFormOpen(true);
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer
          emp={selected}
          depts={depts}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => updateEmp(selected.id, patch)}
          onDelete={() => deleteEmp(selected.id)}
          onEdit={() => {
            setEditing(selected);
            setFormOpen(true);
          }}
        />
      )}

      {/* Form modal */}
      {formOpen && (
        <EmployeeForm
          emp={editing}
          depts={depts}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await load();
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
  tint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${tint} opacity-20 blur-2xl`} />
      <Icon size={16} className="text-muted-foreground" />
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function DetailDrawer({
  emp,
  depts,
  onClose,
  onUpdate,
  onDelete,
  onEdit,
}: {
  emp: Employee;
  depts: Department[];
  onClose: () => void;
  onUpdate: (patch: Partial<Employee>) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const dept = depts.find((d) => d.id === emp.department_id);
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-background/70 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground">
              {initials(emp.full_name)}
            </div>
            <div>
              <div className="font-display text-lg">{emp.full_name}</div>
              <div className="text-xs text-muted-foreground">{emp.title ?? "No title"}</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS.map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate({ status: s })}
                  className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                    emp.status === s
                      ? STATUS_COLOR[s]
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </div>
            <select
              value={emp.department_id ?? ""}
              onChange={(e) => onUpdate({ department_id: e.target.value || null })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info icon={Mail} label="Email" value={emp.email ?? "—"} />
            <Info icon={Phone} label="Phone" value={emp.phone ?? "—"} />
            <Info icon={Building2} label="Department" value={dept?.name ?? "Unassigned"} />
            <Info icon={UserCheck} label="Type" value={emp.employment_type.replace("_", " ")} />
            <Info icon={BadgeDollarSign} label="Monthly" value={money(emp.monthly_salary)} />
            <Info icon={BadgeDollarSign} label="Hourly" value={money(emp.hourly_rate)} />
            <Info
              icon={Calendar}
              label="Joined"
              value={emp.joined_at ? new Date(emp.joined_at).toLocaleDateString() : "—"}
            />
            <Info
              icon={Calendar}
              label="Added"
              value={new Date(emp.created_at).toLocaleDateString()}
            />
          </div>

          {emp.notes && (
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</div>
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                {emp.notes}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex gap-2 border-t border-border p-4">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-red-500/30 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </aside>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon size={11} /> {label}
      </div>
      <div className="mt-1 truncate text-sm capitalize">{value}</div>
    </div>
  );
}

function EmployeeForm({
  emp,
  depts,
  onClose,
  onSaved,
}: {
  emp: Employee | null;
  depts: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: emp?.full_name ?? "",
    email: emp?.email ?? "",
    phone: emp?.phone ?? "",
    title: emp?.title ?? "",
    department_id: emp?.department_id ?? "",
    employment_type: emp?.employment_type ?? "full_time",
    status: emp?.status ?? "active",
    monthly_salary: emp?.monthly_salary?.toString() ?? "",
    hourly_rate: emp?.hourly_rate?.toString() ?? "",
    joined_at: emp?.joined_at ?? "",
    notes: emp?.notes ?? "",
  });

  async function save() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      title: form.title.trim() || null,
      department_id: form.department_id || null,
      employment_type: form.employment_type,
      status: form.status,
      monthly_salary: form.monthly_salary ? Number(form.monthly_salary) : null,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      joined_at: form.joined_at || null,
      notes: form.notes.trim() || null,
    };
    if (emp) await supabase.from("employees").update(payload).eq("id", emp.id);
    else await supabase.from("employees").insert(payload);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <div className="font-display text-lg">{emp ? "Edit employee" : "Add new team member"}</div>
            <div className="text-xs text-muted-foreground">
              An `employee` role is granted automatically when the email matches a sign-in account.
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field label="Full name *">
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Accountant"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Department">
            <select
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select
              value={form.employment_type}
              onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Joined date">
            <input
              type="date"
              value={form.joined_at ?? ""}
              onChange={(e) => setForm({ ...form, joined_at: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Monthly salary (£)">
            <input
              type="number"
              value={form.monthly_salary}
              onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Hourly rate (£)">
            <input
              type="number"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.full_name.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {emp ? "Save changes" : "Create employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
