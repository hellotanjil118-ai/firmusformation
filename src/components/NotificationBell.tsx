import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Notif = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    setItems((data as Notif[]) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("notif-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const openNotif = async (n: Notif) => {
    if (!n.read) await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    setOpen(false);
    if (n.link) navigate({ to: n.link });
    load();
  };

  const markAll = async () => {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    load();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-md p-2 hover:bg-secondary" aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-elegant">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Check size={12} /> Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No notifications yet</p>
              ) : items.map((n) => (
                <button key={n.id} onClick={() => openNotif(n)} className={`block w-full border-b border-border px-3 py-2.5 text-left text-sm hover:bg-secondary ${!n.read ? "bg-primary/5" : ""}`}>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
