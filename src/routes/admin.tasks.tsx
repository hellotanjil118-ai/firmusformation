import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Loader2,
  X,
  CheckSquare,
  Calendar,
  Flag,
  Trash2,
  Pencil,
  FolderKanban,
  User as UserIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin/tasks")({
  head: () => ({ meta: [{ title: "Tasks & Projects — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: string;
  due_at: string | null;
  department_id: string | null;
};
type Task = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_at: string | null;
  labels: string[] | null;
  order_index: number;
};
type Employee = { id: string; full_name: string };

const STATUSES = ["todo", "in_progress", "review", "done"] as const;
const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30",
  medium: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  high: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  urgent: "bg-red-500/10 text-red-600 border-red-500/30",
};

function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeProject, setActiveProject] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  async function load() {
    setLoading(true);
    const [p, t, e] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("order_index", { ascending: true }),
      supabase.from("employees").select("id, full_name").eq("status", "active").order("full_name"),
    ]);
    setProjects((p.data ?? []) as Project[]);
    setTasks((t.data ?? []) as Task[]);
    setEmployees((e.data ?? []) as Employee[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredTasks = useMemo(
    () => (activeProject === "all" ? tasks : tasks.filter((t) => t.project_id === activeProject)),
    [tasks, activeProject],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
    filteredTasks.forEach((t) => (c[t.status] = (c[t.status] ?? 0) + 1));
    return c;
  }, [filteredTasks]);

  async function moveTask(task: Task, newStatus: string) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at: newStatus === "done" ? new Date().toISOString() : null })
      .eq("id", task.id);
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((p) => p.filter((t) => t.id !== id));
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project and all its tasks?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects((p) => p.filter((x) => x.id !== id));
    setTasks((p) => p.filter((t) => t.project_id !== id));
    if (activeProject === id) setActiveProject("all");
  }

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  return (
    <AdminShell title="Tasks & Projects" subtitle="Kanban workspace · Company-wide">
      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{STATUS_LABEL[s]}</div>
            <div className="mt-1 font-display text-2xl">{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Projects strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveProject("all")}
          className={`rounded-full border px-3 py-1.5 text-xs ${
            activeProject === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          All projects · {tasks.length}
        </button>
        {projects.map((p) => {
          const count = tasks.filter((t) => t.project_id === p.id).length;
          const active = activeProject === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? "#6366f1" }} />
              {p.name} · {count}
            </button>
          );
        })}
        <button
          onClick={() => {
            setEditingProject(null);
            setShowProjectForm(true);
          }}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus size={12} /> New project
        </button>
        <div className="ml-auto flex gap-2">
          {activeProject !== "all" && projectById.get(activeProject) && (
            <>
              <button
                onClick={() => {
                  setEditingProject(projectById.get(activeProject) ?? null);
                  setShowProjectForm(true);
                }}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Pencil size={12} /> Edit project
              </button>
              <button
                onClick={() => deleteProject(activeProject)}
                className="flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/10"
              >
                <Trash2 size={12} /> Delete
              </button>
            </>
          )}
          <button
            onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-elegant hover:opacity-90"
          >
            <Plus size={12} /> New task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const list = filteredTasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.order_index - b.order_index);
            return (
              <div key={status} className="flex flex-col rounded-xl border border-border bg-card/40">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="text-sm font-medium">{STATUS_LABEL[status]}</div>
                  <div className="text-xs text-muted-foreground">{list.length}</div>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {list.length === 0 && (
                    <div className="grid place-items-center rounded-md border border-dashed border-border/60 py-8 text-xs text-muted-foreground">
                      No tasks
                    </div>
                  )}
                  {list.map((t) => {
                    const proj = t.project_id ? projectById.get(t.project_id) : null;
                    const assignee = t.assignee_id ? empById.get(t.assignee_id) : null;
                    return (
                      <div key={t.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => {
                              setEditingTask(t);
                              setShowTaskForm(true);
                            }}
                            className="text-left text-sm font-medium leading-tight hover:text-primary"
                          >
                            {t.title}
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="text-muted-foreground hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {t.description && (
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${PRIORITY_COLOR[t.priority]}`}
                          >
                            <Flag size={9} /> {t.priority}
                          </span>
                          {proj && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: proj.color ?? "#6366f1" }} />
                              {proj.name}
                            </span>
                          )}
                          {t.due_at && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              <Calendar size={9} /> {new Date(t.due_at).toLocaleDateString()}
                            </span>
                          )}
                          {assignee && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                              <UserIcon size={9} /> {assignee.full_name}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {STATUSES.filter((s) => s !== t.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => moveTask(t, s)}
                              className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                            >
                              → {STATUS_LABEL[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showProjectForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => setShowProjectForm(false)}
          onSaved={() => {
            setShowProjectForm(false);
            load();
          }}
        />
      )}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          projects={projects}
          employees={employees}
          defaultProject={activeProject === "all" ? null : activeProject}
          onClose={() => setShowTaskForm(false)}
          onSaved={() => {
            setShowTaskForm(false);
            load();
          }}
        />
      )}
    </AdminShell>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

function ProjectForm({
  project,
  onClose,
  onSaved,
}: {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? "#6366f1");
  const [status, setStatus] = useState(project?.status ?? "active");
  const [dueAt, setDueAt] = useState(project?.due_at?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      color,
      status,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    };
    if (project) {
      await supabase.from("projects").update(payload).eq("id", project.id);
    } else {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("projects").insert({ ...payload, created_by: u.user?.id ?? null });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Color">
            <input type="color" className={inputCls + " h-10 p-1"} value={color} onChange={(e) => setColor(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskForm({
  task,
  projects,
  employees,
  defaultProject,
  onClose,
  onSaved,
}: {
  task: Task | null;
  projects: Project[];
  employees: Employee[];
  defaultProject: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [projectId, setProjectId] = useState<string | "">(task?.project_id ?? defaultProject ?? "");
  const [assigneeId, setAssigneeId] = useState<string | "">(task?.assignee_id ?? "");
  const [dueAt, setDueAt] = useState(task?.due_at?.slice(0, 10) ?? "");
  const [labels, setLabels] = useState((task?.labels ?? []).join(", "));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      project_id: projectId || null,
      assignee_id: assigneeId || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      labels: labels.split(",").map((s) => s.trim()).filter(Boolean),
      completed_at: status === "done" ? new Date().toISOString() : null,
    };
    if (task) {
      await supabase.from("tasks").update(payload).eq("id", task.id);
    } else {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("tasks").insert({ ...payload, created_by: u.user?.id ?? null });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project">
            <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assignee">
            <select className={inputCls} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputCls} value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
          <Field label="Labels (comma-sep)">
            <input className={inputCls} value={labels} onChange={(e) => setLabels(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
