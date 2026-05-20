import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/portal/tickets/$id")({
  head: () => ({ meta: [{ title: "Ticket — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalTicketDetail,
});

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; created_at: string };
type Msg = { id: string; sender_type: string; body: string; created_at: string };

function PortalTicketDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: t } = await supabase.from("support_tickets").select("*").eq("id", id).maybeSingle();
    setTicket(t as Ticket | null);
    const { data: m } = await supabase.from("ticket_messages").select("*").eq("ticket_id", id).order("created_at");
    setMessages((m as Msg[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const send = async () => {
    if (!reply.trim() || !user) return;
    await supabase.from("ticket_messages").insert({ ticket_id: id, sender_id: user.id, sender_type: "client", body: reply.trim() });
    await supabase.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", id);
    setReply("");
    load();
  };

  if (loading) return <PortalShell title="Ticket"><Loader2 className="animate-spin" /></PortalShell>;
  if (!ticket) return <PortalShell title="Not found"><p className="text-muted-foreground">Ticket not found.</p></PortalShell>;

  return (
    <PortalShell title={ticket.subject}>
      <Link to="/portal/tickets" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> All tickets</Link>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-secondary px-2.5 py-1 capitalize">{ticket.category}</span>
        <span className="rounded-full bg-secondary px-2.5 py-1 capitalize">{ticket.priority} priority</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 capitalize text-primary">{ticket.status}</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 max-h-[480px] space-y-3 overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-lg p-3 text-sm ${m.sender_type === "client" ? "ml-8 bg-primary/10" : "mr-8 bg-secondary"}`}>
              <div className="mb-1 text-xs text-muted-foreground">{m.sender_type === "client" ? "You" : "Firmus support"} · {new Date(m.created_at).toLocaleString()}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        {ticket.status !== "closed" && (
          <div className="flex gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a reply…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={send} className="inline-flex items-center gap-1 rounded-md bg-gradient-gold px-3 py-2 text-sm font-semibold text-gold-foreground"><Send size={14} /></button>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
