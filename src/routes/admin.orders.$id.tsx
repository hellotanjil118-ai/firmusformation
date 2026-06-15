import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Clock, AlertOctagon, Send, Upload, FileText, Download, Eye, EyeOff } from "lucide-react";
import { ORDER_STATUSES, STATUS_LABEL, STAGE_STATUSES, type OrderStatus, type StageStatus } from "@/lib/orderConstants";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Admin — Order" }, { name: "robots", content: "noindex" }] }),
  component: OrderDetail,
});

type Stage = { id: string; order_id: string; name: string; description: string | null; order_index: number; status: StageStatus; completed_at: string | null; notes: string | null };
type Msg = { id: string; sender_type: string; body: string; created_at: string };
type Doc = { id: string; name: string; file_path: string; file_size: number | null; mime_type: string | null; uploader_type: string; client_visible: boolean; created_at: string };
type Order = {
  id: string; client_id: string; package_name: string; price: number; currency: string;
  status: OrderStatus; notes: string | null; due_at: string | null; started_at: string | null;
  client?: { id: string; name: string; email: string };
};

const STAGE_ICON: Record<StageStatus, typeof Circle> = { pending: Circle, in_progress: Clock, done: CheckCircle2, blocked: AlertOctagon };
const STAGE_COLOR: Record<StageStatus, string> = { pending: "text-muted-foreground", in_progress: "text-blue-500", done: "text-green-500", blocked: "text-red-500" };

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [newStage, setNewStage] = useState("");

  const load = async () => {
    const { data: o } = await supabase.from("orders").select("*, client:clients(id,name,email)").eq("id", id).single();
    setOrder(o as unknown as Order);
    const { data: s } = await supabase.from("order_stages").select("*").eq("order_id", id).order("order_index");
    setStages((s as Stage[]) ?? []);
    const { data: m } = await supabase.from("order_messages").select("*").eq("order_id", id).order("created_at");
    setMessages((m as Msg[]) ?? []);
  };
  useEffect(() => { load(); }, [id]);

  const updateOrder = async (patch: Partial<Omit<Order, "client">>) => {
    await supabase.from("orders").update(patch).eq("id", id);
    load();
  };

  const updateStage = async (stageId: string, patch: Partial<Stage>) => {
    if (patch.status === "done" && !patch.completed_at) patch.completed_at = new Date().toISOString();
    if (patch.status && patch.status !== "done") patch.completed_at = null;
    await supabase.from("order_stages").update(patch).eq("id", stageId);
    load();
  };

  const addStage = async () => {
    if (!newStage.trim()) return;
    await supabase.from("order_stages").insert({ order_id: id, name: newStage.trim(), order_index: stages.length, status: "pending" });
    setNewStage("");
    load();
  };

  const deleteStage = async (sid: string) => {
    if (!confirm("Delete this stage?")) return;
    await supabase.from("order_stages").delete().eq("id", sid);
    load();
  };

  const deleteOrder = async () => {
    if (!confirm("Delete this entire order? This cannot be undone.")) return;
    await supabase.from("orders").delete().eq("id", id);
    navigate({ to: "/admin/orders" });
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("order_messages").insert({ order_id: id, sender_id: u.user?.id, sender_type: "admin", body: newMsg.trim() });
    setNewMsg("");
    load();
  };

  if (!order) return <AdminShell title="Order"><Loader2 className="animate-spin" /></AdminShell>;

  const progress = stages.length > 0 ? Math.round((stages.filter((s) => s.status === "done").length / stages.length) * 100) : 0;

  return (
    <AdminShell title={order.package_name}>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back to orders</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Progress */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg">Progress</h2>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Stages */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Service Timeline</h2>
            <div className="space-y-3">
              {stages.map((s) => {
                const Icon = STAGE_ICON[s.status];
                return (
                  <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Icon className={`mt-0.5 ${STAGE_COLOR[s.status]}`} size={20} />
                    <div className="flex-1">
                      <input value={s.name} onChange={(e) => setStages(stages.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))} onBlur={(e) => updateStage(s.id, { name: e.target.value })} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
                      <textarea placeholder="Notes" value={s.notes || ""} onChange={(e) => setStages(stages.map((x) => x.id === s.id ? { ...x, notes: e.target.value } : x))} onBlur={(e) => updateStage(s.id, { notes: e.target.value })} rows={1} className="mt-1 w-full resize-none bg-transparent text-xs text-muted-foreground focus:outline-none" />
                      {s.completed_at && <p className="mt-1 text-xs text-green-600">Done {new Date(s.completed_at).toLocaleDateString()}</p>}
                    </div>
                    <select value={s.status} onChange={(e) => updateStage(s.id, { status: e.target.value as StageStatus })} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                      {STAGE_STATUSES.map((st) => <option key={st} value={st}>{st.replace("_", " ")}</option>)}
                    </select>
                    <button onClick={() => deleteStage(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                );
              })}
              <div className="flex gap-2">
                <input value={newStage} onChange={(e) => setNewStage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStage()} placeholder="Add new stage" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <button onClick={addStage} className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary"><Plus size={14} /> Add</button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Messages with Client</h2>
            <div className="mb-4 max-h-72 space-y-2 overflow-auto">
              {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${m.sender_type === "admin" ? "ml-8 bg-primary/10" : "mr-8 bg-secondary"}`}>
                  <div className="mb-1 text-xs text-muted-foreground">{m.sender_type === "admin" ? "You (admin)" : "Client"} · {new Date(m.created_at).toLocaleString()}</div>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message to the client" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={sendMessage} className="inline-flex items-center gap-1 rounded-md bg-gradient-gold px-3 py-2 text-sm font-semibold text-gold-foreground"><Send size={14} /></button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Client</label>
                <p className="font-medium">{order.client?.name}</p>
                <p className="text-xs text-muted-foreground">{order.client?.email}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Status</label>
                <select value={order.status} onChange={(e) => updateOrder({ status: e.target.value as OrderStatus })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Price</label>
                <p>{order.currency} {Number(order.price).toFixed(2)}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Due Date</label>
                <input type="date" value={order.due_at ? order.due_at.split("T")[0] : ""} onChange={(e) => updateOrder({ due_at: e.target.value || null })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Internal Notes</label>
                <textarea value={order.notes || ""} onChange={(e) => setOrder({ ...order, notes: e.target.value })} onBlur={(e) => updateOrder({ notes: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
              </div>
            </div>
          </div>

          <button onClick={deleteOrder} className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
            <Trash2 size={14} /> Delete Order
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
