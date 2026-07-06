import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Hash, Building2, Send, Loader2, Users, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/community")({
  head: () => ({
    meta: [
      { title: "Team Community — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

type Channel = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  kind: "company" | "department";
  department_id: string | null;
};

type Message = {
  id: string;
  channel_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_avatar: string | null;
  body: string;
  created_at: string;
};

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  const parts = s.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || s[0]?.toUpperCase() || "?";
}

function Page() {
  const { user, isAdmin } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("employees")
      .select("full_name,avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.full_name || user.email?.split("@")[0] || "Team");
        setAvatar(data?.avatar_url ?? null);
      });
  }, [user]);

  const loadChannels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_channels" as any)
      .select("id,name,slug,description,kind,department_id")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    const list = (data as Channel[]) ?? [];
    setChannels(list);
    if (!activeId && list.length) setActiveId(list[0].id);
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    supabase
      .from("community_messages" as any)
      .select("*")
      .eq("channel_id", activeId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages((data as Message[]) ?? []);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
      });

    const channel = supabase
      .channel(`community:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages", filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_messages", filter: `channel_id=eq.${activeId}` },
        (payload) => {
          const m = payload.old as Message;
          setMessages((prev) => prev.filter((x) => x.id !== m.id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  const send = async () => {
    if (!activeId || !body.trim() || !user) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("community_messages" as any).insert({
      channel_id: activeId,
      sender_id: user.id,
      sender_name: displayName,
      sender_avatar: avatar,
      body: text,
    });
    if (error) setBody(text);
    setSending(false);
  };

  const removeMessage = async (id: string) => {
    await supabase.from("community_messages" as any).delete().eq("id", id);
  };

  const active = useMemo(() => channels.find((c) => c.id === activeId) || null, [channels, activeId]);
  const company = channels.filter((c) => c.kind === "company");
  const depts = channels.filter((c) => c.kind === "department");

  const createChannel = async () => {
    const name = window.prompt("Channel name?");
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error, data } = await supabase
      .from("community_channels" as any)
      .insert({ name, slug: slug || `ch-${Date.now()}`, kind: "company", created_by: user?.id })
      .select("id,name,slug,description,kind,department_id")
      .single();
    if (!error && data) {
      setChannels((c) => [...c, data as Channel]);
      setActiveId((data as Channel).id);
    } else if (error) {
      alert(error.message);
    }
  };

  return (
    <AdminShell title="Team Community" subtitle="Chat across departments and the whole company">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold">Channels</span>
            </div>
            {isAdmin && (
              <button
                onClick={createChannel}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label="New channel"
                title="New channel"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {loading ? (
              <div className="grid place-items-center p-6">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <SectionLabel>Company</SectionLabel>
                {company.length === 0 && <Empty>No company channels</Empty>}
                {company.map((c) => (
                  <ChannelButton key={c.id} c={c} activeId={activeId} onClick={() => setActiveId(c.id)} />
                ))}
                <SectionLabel className="mt-3">Departments</SectionLabel>
                {depts.length === 0 && <Empty>No department channels yet</Empty>}
                {depts.map((c) => (
                  <ChannelButton key={c.id} c={c} activeId={activeId} onClick={() => setActiveId(c.id)} />
                ))}
              </>
            )}
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-xl border border-border bg-card">
          {!active ? (
            <div className="grid flex-1 place-items-center p-10 text-center text-sm text-muted-foreground">
              Select a channel to start chatting.
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border p-4">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-md ${
                    active.kind === "company" ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {active.kind === "company" ? <Hash size={16} /> : <Building2 size={16} />}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-lg">{active.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {active.description || (active.kind === "company" ? "Company-wide channel" : "Department channel")}
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                    No messages yet — say hi 👋
                  </div>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className="group flex items-start gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-semibold">
                          {m.sender_avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.sender_avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(m.sender_name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="truncate text-sm font-semibold">{m.sender_name || "Team member"}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(m.created_at).toLocaleString()}
                            </span>
                            {(mine || isAdmin) && (
                              <button
                                onClick={() => removeMessage(m.id)}
                                className="ml-auto rounded p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                                aria-label="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.body}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={`Message #${active.name}`}
                    rows={2}
                    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button
                    onClick={send}
                    disabled={sending || !body.trim()}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 text-xs text-muted-foreground">{children}</div>;
}

function ChannelButton({
  c,
  activeId,
  onClick,
}: {
  c: Channel;
  activeId: string | null;
  onClick: () => void;
}) {
  const active = c.id === activeId;
  const Icon = c.kind === "company" ? Hash : Building2;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{c.name}</span>
    </button>
  );
}
