import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2, Plus, Users, Target, TrendingUp, Pencil, Trash2, UserPlus,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin/departments")({ component: Page });

type Department = {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  description: string | null;
  color: string | null;
  monthly_target: number | null;
  status: string;
  sort_order: number;
};

type Employee = {
  id: string;
  full_name: string;
  email: string | null;
  title: string | null;
  department_id: string | null;
  status: string;
  monthly_salary: number | null;
  avatar_url: string | null;
};

const emptyDept = {
  name: "", slug: "", code: "", description: "",
  color: "#6366f1", monthly_target: 0, status: "active",
};

function Page() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState<typeof emptyDept>(emptyDept);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);
  const [empOpen, setEmpOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    full_name: "", email: "", title: "", department_id: "",
    monthly_salary: 0, status: "active",
  });

  async function load() {
    setLoading(true);
    const [d, e] = await Promise.all([
      supabase.from("departments").select("*").order("sort_order"),
      supabase.from("employees").select("*").order("full_name"),
    ]);
    setDepartments((d.data || []) as Department[]);
    setEmployees((e.data || []) as Employee[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const selected = useMemo(
    () => departments.find((x) => x.id === selectedId) || departments[0] || null,
    [departments, selectedId],
  );

  const empByDept = useMemo(() => {
    const m: Record<string, Employee[]> = {};
    for (const e of employees) {
      const k = e.department_id || "unassigned";
      (m[k] ||= []).push(e);
    }
    return m;
  }, [employees]);

  const chartData = useMemo(
    () => departments.map((d) => ({
      name: d.code || d.name.slice(0, 4),
      Headcount: (empByDept[d.id] || []).length,
      Target: Number(d.monthly_target || 0) / 1000,
      color: d.color || "#6366f1",
    })),
    [departments, empByDept],
  );

  const totalEmp = employees.filter((e) => e.status === "active").length;
  const totalTarget = departments.reduce((s, d) => s + Number(d.monthly_target || 0), 0);
  const totalSalary = employees.reduce((s, e) => s + Number(e.monthly_salary || 0), 0);

  function openCreateDept() {
    setEditingId(null);
    setDeptForm(emptyDept);
    setDeptOpen(true);
  }
  function openEditDept(d: Department) {
    setEditingId(d.id);
    setDeptForm({
      name: d.name, slug: d.slug, code: d.code || "",
      description: d.description || "", color: d.color || "#6366f1",
      monthly_target: Number(d.monthly_target || 0), status: d.status,
    });
    setDeptOpen(true);
  }
  async function saveDept() {
    if (!deptForm.name.trim()) { toast.error("Name required"); return; }
    const payload = {
      ...deptForm,
      slug: deptForm.slug || deptForm.name.toLowerCase().replace(/\s+/g, "-"),
      monthly_target: Number(deptForm.monthly_target) || 0,
    };
    const res = editingId
      ? await supabase.from("departments").update(payload).eq("id", editingId)
      : await supabase.from("departments").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editingId ? "Department updated" : "Department created");
    setDeptOpen(false);
    load();
  }
  async function deleteDept(id: string) {
    if (!confirm("Delete this department? Employees will be unassigned.")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    if (selectedId === id) setSelectedId(null);
    load();
  }

  function openAddEmployee(deptId?: string) {
    setEmpForm({
      full_name: "", email: "", title: "",
      department_id: deptId || selected?.id || "",
      monthly_salary: 0, status: "active",
    });
    setEmpOpen(true);
  }
  async function saveEmployee() {
    if (!empForm.full_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("employees").insert({
      ...empForm,
      department_id: empForm.department_id || null,
      monthly_salary: Number(empForm.monthly_salary) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Team member added");
    setEmpOpen(false);
    load();
  }
  async function reassign(empId: string, deptId: string) {
    const { error } = await supabase.from("employees")
      .update({ department_id: deptId === "unassigned" ? null : deptId })
      .eq("id", empId);
    if (error) { toast.error(error.message); return; }
    toast.success("Reassigned");
    load();
  }
  async function removeEmployee(id: string) {
    if (!confirm("Remove this team member?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const selectedEmps = selected ? empByDept[selected.id] || [] : [];

  return (
    <AdminShell
      title="Department Management"
      subtitle="Org structure, headcount, KPIs and team assignments"
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Building2} label="Departments" value={departments.length} />
        <KpiCard icon={Users} label="Active members" value={totalEmp} />
        <KpiCard icon={Target} label="Monthly target" value={`$${totalTarget.toLocaleString()}`} />
        <KpiCard icon={TrendingUp} label="Monthly payroll" value={`$${totalSalary.toLocaleString()}`} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Headcount & target by department</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Headcount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" name="Target ($k)" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Headcount distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter((c) => c.Headcount > 0)}
                  dataKey="Headcount" nameKey="name" outerRadius={90} label
                >
                  {chartData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={openCreateDept}><Plus className="w-4 h-4 mr-2" />New department</Button>
        <Button variant="outline" onClick={() => openAddEmployee()}>
          <UserPlus className="w-4 h-4 mr-2" />Add team member
        </Button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Department list */}
        <div className="space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {departments.map((d) => {
            const count = (empByDept[d.id] || []).length;
            const active = selected?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                    style={{ background: d.color || "#6366f1" }}
                  >
                    {d.code || d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                      <span>{count} member{count === 1 ? "" : "s"}</span>
                      {d.monthly_target ? <span>· ${Number(d.monthly_target).toLocaleString()}/mo</span> : null}
                    </div>
                  </div>
                  <Badge variant={d.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {d.status}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <Card className="min-h-[400px]">
          {!selected ? (
            <CardContent className="p-10 text-center text-muted-foreground">
              Select a department to view its team and KPIs.
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded text-white text-xs font-bold flex items-center justify-center"
                      style={{ background: selected.color || "#6366f1" }}
                    >
                      {selected.code || selected.name.slice(0, 2).toUpperCase()}
                    </div>
                    {selected.name}
                  </CardTitle>
                  {selected.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEditDept(selected)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteDept(selected.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Headcount" value={selectedEmps.length} />
                  <MiniStat label="Monthly target" value={`$${Number(selected.monthly_target || 0).toLocaleString()}`} />
                  <MiniStat
                    label="Payroll"
                    value={`$${selectedEmps.reduce((s, e) => s + Number(e.monthly_salary || 0), 0).toLocaleString()}`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Team members</h3>
                  <Button size="sm" variant="outline" onClick={() => openAddEmployee(selected.id)}>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />Add
                  </Button>
                </div>

                {selectedEmps.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                    No team members assigned yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEmps.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {e.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{e.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {e.title || "—"}{e.email ? ` · ${e.email}` : ""}
                          </div>
                        </div>
                        <Select value={e.department_id || "unassigned"} onValueChange={(v) => reassign(e.id, v)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {departments.map((d) => (
                              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => removeEmployee(e.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {(empByDept["unassigned"]?.length || 0) > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-sm mb-2 text-muted-foreground">
                      Unassigned ({empByDept["unassigned"].length}) — assign below
                    </h3>
                    <div className="space-y-2">
                      {empByDept["unassigned"].map((e) => (
                        <div key={e.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
                          <div className="flex-1 text-sm truncate">{e.full_name} · {e.title || "—"}</div>
                          <Button size="sm" variant="outline" onClick={() => reassign(e.id, selected.id)}>
                            Assign here
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Department dialog */}
      <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit department" : "New department"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input maxLength={6} value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} /></div>
              <div><Label>Color</Label><Input type="color" value={deptForm.color} onChange={(e) => setDeptForm({ ...deptForm, color: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea rows={2} value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Monthly target ($)</Label><Input type="number" value={deptForm.monthly_target} onChange={(e) => setDeptForm({ ...deptForm, monthly_target: Number(e.target.value) })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={deptForm.status} onValueChange={(v) => setDeptForm({ ...deptForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptOpen(false)}>Cancel</Button>
            <Button onClick={saveDept}>{editingId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee dialog */}
      <Dialog open={empOpen} onOpenChange={setEmpOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={empForm.full_name} onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} /></div>
              <div><Label>Title</Label><Input value={empForm.title} onChange={(e) => setEmpForm({ ...empForm, title: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Department</Label>
                <Select value={empForm.department_id} onValueChange={(v) => setEmpForm({ ...empForm, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Monthly salary ($)</Label><Input type="number" value={empForm.monthly_salary} onChange={(e) => setEmpForm({ ...empForm, monthly_salary: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpOpen(false)}>Cancel</Button>
            <Button onClick={saveEmployee}>Add member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-semibold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-lg border bg-muted/30">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
