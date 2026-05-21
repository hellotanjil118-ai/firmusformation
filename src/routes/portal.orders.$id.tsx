import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, CheckCircle2, Circle, Clock, AlertOctagon, Send, Upload, FileText, Download } from "lucide-react";
import { STATUS_LABEL, STATUS_COLOR, type OrderStatus, type StageStatus } from "@/lib/orderConstants";

export const Route = createFileRoute("/portal/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalOrderDetail,
});

type Order = { id: string; package_name: string; price: number; currency: string; status: OrderStatus; due_at: string | null; started_at: string | null };
type Stage = { id: string; name: string; description: string | null; order_index: number; status: StageStatus; completed_at: string | null; notes: string | null };
type Msg = { id: string; sender_type: string; body: string; created_at: string };
type Doc = { id: string; name: string; file_path: string; file_size: number | null; mime_type: string | null; uploader_type: string; created_at: string };

const ICON: Record<StageStatus, typeof Circle> = { pending: Circle, in_progress: Clock, done: CheckCircle2, blocked: AlertOctagon };
const COLOR: Record<StageStatus, string> = { pending: "text-muted-foreground", in_progress: "text-blue-500", done: "text-green-500", blocked: "text-red-500" };

function PortalOrderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: o } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    setOrder(o as Order | null);
    const { data: s } = await supabase.from("order_stages").select("*").eq("order_id", id).order("order_index");
    setStages((s as Stage[]) ?? []);
    const { data: m } = await supabase.from("order_messages").select("*").eq("order_id", id).order("created_at");
    setMessages((m as Msg[]) ?? []);
    const { data: d } = await supabase.from("order_documents").select("*").eq("order_id", id).order("created_at", { ascending: false });
    setDocs((d as Doc[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("order-documents").upload(path, file);
    if (upErr) { alert(upErr.message); setUploading(false); return; }
    const { error: insErr } = await supabase.from("order_documents").insert({
      order_id: id, name: file.name, file_path: path, file_size: file.size,
      mime_type: file.type, uploader_type: "client", uploaded_by: user.id, client_visible: true,
    });
    if (insErr) alert(insErr.message);
    setUploading(false);
    e.target.value = "";
    load();
  };

  const downloadDoc = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("order-documents").createSignedUrl(d.file_path, 60);
    if (error || !data) return alert(error?.message ?? "Failed to fetch file");
    window.open(data.signedUrl, "_blank");
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    await supabase.from("order_messages").insert({ order_id: id, sender_id: user.id, sender_type: "client", body: newMsg.trim() });
    setNewMsg("");
    load();
  };

  if (loading) return <PortalShell title="Order"><Loader2 className="animate-spin" /></PortalShell>;
  if (!order) return <PortalShell title="Not found"><p className="text-muted-foreground">Order not found or you don't have access.</p></PortalShell>;

  const progress = stages.length > 0 ? Math.round((stages.filter((s) => s.status === "done").length / stages.length) * 100) : 0;

  return (
    <PortalShell title={order.package_name}>
      <Link to="/portal/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Back to orders</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current status</p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="font-display text-2xl">{progress}%</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Service Timeline</h2>
            <div className="space-y-3">
              {stages.length === 0 ? <p className="text-sm text-muted-foreground">Timeline will appear here once your service begins.</p> : stages.map((s) => {
                const Icon = ICON[s.status];
                return (
                  <div key={s.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <Icon className={`mt-0.5 ${COLOR[s.status]}`} size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                      {s.completed_at && <p className="mt-1 text-xs text-green-600">Completed {new Date(s.completed_at).toLocaleDateString()}</p>}
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">{s.status.replace("_", " ")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Messages</h2>
            <div className="mb-4 max-h-72 space-y-2 overflow-auto">
              {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet. Send your support team a message below.</p> : messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${m.sender_type === "client" ? "ml-8 bg-primary/10" : "mr-8 bg-secondary"}`}>
                  <div className="mb-1 text-xs text-muted-foreground">{m.sender_type === "client" ? "You" : "Firmus team"} · {new Date(m.created_at).toLocaleString()}</div>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask a question or send an update" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={sendMessage} className="inline-flex items-center gap-1 rounded-md bg-gradient-gold px-3 py-2 text-sm font-semibold text-gold-foreground"><Send size={14} /></button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 text-sm">
            <h2 className="mb-3 font-display text-lg">Order Details</h2>
            <dl className="space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Package</dt><dd className="font-medium">{order.package_name}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Price</dt><dd>{order.currency} {Number(order.price).toFixed(2)}</dd></div>
              {order.started_at && <div className="flex justify-between"><dt className="text-muted-foreground">Started</dt><dd>{new Date(order.started_at).toLocaleDateString()}</dd></div>}
              {order.due_at && <div className="flex justify-between"><dt className="text-muted-foreground">Due</dt><dd>{new Date(order.due_at).toLocaleDateString()}</dd></div>}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-lg">Documents</h2>
            <p className="mb-3 text-xs text-muted-foreground">Upload passports, NID, utility bills, tax docs, or any file we requested.</p>
            <label className={`mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-xs hover:bg-secondary ${uploading ? "opacity-60" : ""}`}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{uploading ? "Uploading…" : "Upload file"}</span>
              <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
            </label>
            <div className="space-y-2">
              {docs.length === 0 ? <p className="text-xs text-muted-foreground">No documents yet.</p> : docs.map((d) => (
                <button key={d.id} onClick={() => downloadDoc(d)} className="flex w-full items-center gap-2 rounded-md border border-border p-2 text-left text-xs hover:bg-secondary">
                  <FileText size={14} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 truncate">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.uploader_type === "client" ? "You" : "Firmus team"} · {new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <Download size={14} className="shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
