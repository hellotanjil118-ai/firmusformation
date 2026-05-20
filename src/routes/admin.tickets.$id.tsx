import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/admin/tickets/$id")({
  head: () => ({ meta: [{ title: "Ticket — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTicketDetail,
});

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; client_id: string; created_at: string; clients?: { name: string; email: string } | null };
type Msg = { id: string; sender_type: string; body: string; created_at: string };

const STATUSES = ["open", "pending", "resolved", "closed"];

function AdminTicketDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: t } = await supabase.from("support_tickets").select("*,clients(name,email)").eq("id", id).maybeSingle();
    setTicket(t as unknown as Ticket | null);
    const { data: m } = await supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at");
    setMessages((m as Msg[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const send = async () => {
    if (!reply.trim() || !user) return;
    await supabase.from("ticket_messages").insert({ ticket_id: id, sender_id: user.id, sender_type: "admin", body: reply.trim() });
    await supabase.from("support_tickets").update({ status: "pending", updated_at: new Date().toISOString() }).eq("id", id);
    setReply("");
    load();
  };

  const setStatus = async (status: string) => {
    await supabase.from("support_tickets").update({
      status,
      closed_at: status === "closed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    load();
  };

  if (loading) return <AdminShell title="Ticket"><Loader2 className="animate-spin" /></AdminShell>;
  if (!ticket) return <AdminShell title="Not found"><p className="text-muted-foreground">Ticket not found.</p></AdminShell>;

  return (
    <AdminShell title={ticket.subject}>
      <Link to="/admin/tickets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> All tickets</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 max-h-[500px] space-y-3 overflow-auto">
              {messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 text-sm ${m.sender_type === "admin" ? "ml-8 bg-primary/10" : "mr-8 bg-secondary"}`}>
                  <div className="mb-1 text-xs text-muted-foreground">{m.sender_type === "admin" ? "You (admin)" : "Client"} · {new Date(m.created_at).toLocaleString()}</div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Reply to client…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={send} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Send size={14} /></button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <h3 className="mb-3 font-display text-base">Client</h3>
            <p className="font-medium">{ticket.clients?.name}</p>
            <p className="text-xs text-muted-foreground">{ticket.clients?.email}</p>
            <Link to="/admin/clients/$id" params={{ id: ticket.client_id }} className="mt-3 inline-block text-xs text-primary hover:underline">View client →</Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <h3 className="mb-3 font-display text-base">Status</h3>
            <select value={ticket.status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd className="capitalize">{ticket.category}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Priority</dt><dd className="capitalize">{ticket.priority}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Opened</dt><dd>{new Date(ticket.created_at).toLocaleDateString()}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
