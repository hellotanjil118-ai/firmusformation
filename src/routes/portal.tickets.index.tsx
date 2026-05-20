import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Plus, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/portal/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalTickets,
});

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; created_at: string; updated_at: string };

const STATUS_COLOR: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600",
  pending: "bg-yellow-500/10 text-yellow-700",
  resolved: "bg-green-500/10 text-green-600",
  closed: "bg-zinc-500/10 text-zinc-600",
};

function PortalTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle();
    if (!client) { setBusy(false); return alert("Your account isn't linked to a client record."); }
    const { data: t, error } = await supabase.from("support_tickets").insert({
      client_id: client.id, subject, category, priority,
    }).select().single();
    if (error || !t) { setBusy(false); return alert(error?.message ?? "Failed"); }
    await supabase.from("ticket_messages").insert({ ticket_id: t.id, sender_id: user.id, sender_type: "client", body });
    await supabase.from("activity_logs").insert({ user_id: user.id, client_id: client.id, action: "ticket_created", details: { ticket_id: t.id } });
    setBusy(false);
    navigate({ to: "/portal/tickets/$id", params: { id: t.id } });
  };

  return (
    <PortalShell title="Support Tickets">
      {loading ? <Loader2 className="animate-spin" /> : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length === 1 ? "" : "s"}</p>
            <button onClick={() => setCreating(!creating)} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-3 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
              <Plus size={14} /> New ticket
            </button>
          </div>

          {creating && (
            <form onSubmit={create} className="mb-6 space-y-3 rounded-xl border border-border bg-card p-5">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Subject" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="documents">Documents</option>
                  <option value="other">Other</option>
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="low">Low priority</option>
                  <option value="normal">Normal priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder="Describe your issue…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />} Submit ticket
              </button>
            </form>
          )}

          {tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <LifeBuoy className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tickets yet. Click "New ticket" to get help from our team.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30 text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">Subject</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Priority</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Updated</th></tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-3"><Link to="/portal/tickets/$id" params={{ id: t.id }} className="font-medium hover:underline">{t.subject}</Link></td>
                      <td className="p-3 capitalize text-muted-foreground">{t.category}</td>
                      <td className="p-3 capitalize">{t.priority}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_COLOR[t.status] ?? ""}`}>{t.status}</span></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </PortalShell>
  );
}
