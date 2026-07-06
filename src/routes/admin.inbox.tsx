import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2,
  Search,
  Send,
  Inbox,
  LifeBuoy,
  ClipboardList,
  Users,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({ meta: [{ title: "Communication Center — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type ThreadKind = "order" | "ticket" | "lead";

type Thread = {
  id: string;
  kind: ThreadKind;
  title: string;
  who: string;
  subtitle: string;
  updated_at: string;
  unreadHint?: string;
  href: string;
};

type Msg = {
  id: string;
  body: string;
  sender_type: string;
  sender_id: string | null;
  created_at: string;
};

function Page() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState<"all" | ThreadKind>("all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Thread | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const [orders, tickets, leads] = await Promise.all([
      supabase
        .from("orders")
        .select("id,package_name,status,updated_at,client_id,clients(name,email)")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("support_tickets")
        .select("id,subject,status,priority,updated_at,client_id,clients(name,email)")
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("leads")
        .select("id,name,email,status,service,updated_at,message")
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

    const list: Thread[] = [];
    (orders.data ?? []).forEach((o: any) => {
      list.push({
        id: o.id,
        kind: "order",
        title: o.package_name ?? "Order",
        who: o.clients?.name ?? o.clients?.email ?? "Client",
        subtitle: `Order · ${o.status}`,
        updated_at: o.updated_at,
        href: `/admin/orders/${o.id}`,
      });
    });
    (tickets.data ?? []).forEach((t: any) => {
      list.push({
        id: t.id,
        kind: "ticket",
        title: t.subject,
        who: t.clients?.name ?? t.clients?.email ?? "Client",
        subtitle: `Ticket · ${t.status} · ${t.priority}`,
        updated_at: t.updated_at,
        href: `/admin/tickets/${t.id}`,
      });
    });
    (leads.data ?? []).forEach((l: any) => {
      list.push({
        id: l.id,
        kind: "lead",
        title: l.service ? `Inquiry: ${l.service}` : "New Lead",
        who: l.name ?? l.email ?? "Lead",
        subtitle: `Lead · ${l.status}`,
        updated_at: l.updated_at,
        href: `/admin/leads/${l.id}`,
      });
    });
    list.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    setThreads(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return threads.filter((t) => {
      if (filter !== "all" && t.kind !== filter) return false;
      if (q && !`${t.title} ${t.who} ${t.subtitle}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [threads, filter, q]);

  useEffect(() => {
    if (!active) return;
    setMsgLoading(true);
    (async () => {
      if (active.kind === "order") {
        const { data } = await supabase
          .from("order_messages")
          .select("id,body,sender_type,sender_id,created_at")
          .eq("order_id", active.id)
          .order("created_at", { ascending: true });
        setMsgs((data as Msg[]) ?? []);
      } else if (active.kind === "ticket") {
        const { data } = await supabase
          .from("ticket_messages")
          .select("id,body,sender_type,sender_id,created_at")
          .eq("ticket_id", active.id)
          .order("created_at", { ascending: true });
        setMsgs((data as Msg[]) ?? []);
      } else {
        const [acts, lead] = await Promise.all([
          supabase
            .from("lead_activities")
            .select("id,body,kind,author_id,created_at")
            .eq("lead_id", active.id)
            .order("created_at", { ascending: true }),
          supabase.from("leads").select("message,created_at").eq("id", active.id).maybeSingle(),
        ]);
        const seed: Msg[] = lead.data?.message
          ? [
              {
                id: "seed",
                body: lead.data.message,
                sender_type: "client",
                sender_id: null,
                created_at: lead.data.created_at ?? active.updated_at,
              },
            ]
          : [];
        const rest: Msg[] = (acts.data ?? []).map((a: any) => ({
          id: a.id,
          body: a.body ?? `(${a.kind})`,
          sender_type: a.author_id ? "admin" : "system",
          sender_id: a.author_id,
          created_at: a.created_at,
        }));
        setMsgs([...seed, ...rest]);
      }
      setMsgLoading(false);
    })();
  }, [active]);

  const send = async () => {
    if (!active || !reply.trim() || !user) return;
    setSending(true);
    const body = reply.trim();
    if (active.kind === "order") {
      await supabase.from("order_messages").insert({
        order_id: active.id,
        body,
        sender_type: "admin",
        sender_id: user.id,
      });
    } else if (active.kind === "ticket") {
      await supabase.from("ticket_messages").insert({
        ticket_id: active.id,
        body,
        sender_type: "admin",
        sender_id: user.id,
      });
    } else {
      await supabase.from("lead_activities").insert({
        lead_id: active.id,
        body,
        kind: "note",
        author_id: user.id,
      });
    }
    setReply("");
    // refetch
    setActive({ ...active });
    setSending(false);
  };

  const counts = useMemo(
    () => ({
      all: threads.length,
      order: threads.filter((t) => t.kind === "order").length,
      ticket: threads.filter((t) => t.kind === "ticket").length,
      lead: threads.filter((t) => t.kind === "lead").length,
    }),
    [threads],
  );

  return (
    <AdminShell title="Communication Center" subtitle="Unified inbox across orders, tickets and leads">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-3">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search threads…"
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "order", "ticket", "lead"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-md px-2.5 py-1 text-xs capitalize ${
                    filter === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k} ({counts[k]})
                </button>
              ))}
              <button
                onClick={load}
                className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="grid place-items-center p-8">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations.</div>
            ) : (
              filtered.map((t) => {
                const Icon = t.kind === "order" ? ClipboardList : t.kind === "ticket" ? LifeBuoy : Users;
                const isActive = active?.id === t.id && active.kind === t.kind;
                return (
                  <button
                    key={`${t.kind}-${t.id}`}
                    onClick={() => setActive(t)}
                    className={`flex w-full items-start gap-3 border-b border-border/60 p-3 text-left transition-colors ${
                      isActive ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                        t.kind === "order"
                          ? "bg-blue-500/10 text-blue-600"
                          : t.kind === "ticket"
                            ? "bg-orange-500/10 text-orange-600"
                            : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{t.who}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {new Date(t.updated_at).toLocaleDateString()}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{t.title}</span>
                      <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        {t.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          {!active ? (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div>
                <Inbox className="mx-auto text-muted-foreground" size={40} />
                <p className="mt-3 text-sm text-muted-foreground">Select a conversation to view messages.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg">{active.who}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {active.title} · {active.subtitle}
                  </div>
                </div>
                <Link
                  to={active.href}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  Open <ExternalLink size={12} />
                </Link>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {msgLoading ? (
                  <div className="grid place-items-center p-8">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                ) : msgs.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No messages yet. Send the first reply below.
                  </div>
                ) : (
                  msgs.map((m) => {
                    const mine = m.sender_type === "admin";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            mine ? "bg-primary text-primary-foreground" : "bg-secondary"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{m.body}</div>
                          <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {m.sender_type} · {new Date(m.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={
                      active.kind === "lead"
                        ? "Add an internal note to this lead…"
                        : "Write a reply to the client…"
                    }
                    rows={2}
                    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                    }}
                  />
                  <button
                    onClick={send}
                    disabled={sending || !reply.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">⌘/Ctrl + Enter to send</p>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
