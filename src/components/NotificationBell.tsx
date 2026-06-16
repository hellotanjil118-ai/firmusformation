import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Notification[]) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markOne = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className={`group flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/40 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOne(n.id);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Mark as read"
                      >
                        <Check size={12} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => {
                      markOne(n.id);
                      setOpen(false);
                    }}
                    className="block border-b border-border last:border-0"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className="border-b border-border last:border-0">
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
