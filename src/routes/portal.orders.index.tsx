import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowRight, FileText } from "lucide-react";
import { STATUS_LABEL, STATUS_COLOR, type OrderStatus } from "@/lib/orderConstants";

export const Route = createFileRoute("/portal/orders/")({
  head: () => ({ meta: [{ title: "My Orders — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalOrders,
});

type Order = { id: string; package_name: string; price: number; currency: string; status: OrderStatus; due_at: string | null; created_at: string };

function PortalOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await supabase.rpc("claim_client_by_email" as never);
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
    })();
  }, [user]);

  return (
    <PortalShell title="My Orders">
      <div className="mb-4 flex justify-end">
        <Link to="/portal/orders/new" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
          + Order a service
        </Link>
      </div>
      {orders === null ? <Loader2 className="animate-spin" /> : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto mb-3 text-muted-foreground" size={32} />
          <h2 className="font-display text-lg">No orders yet — place your first one above.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a service and tell us about your project to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <Link key={o.id} to="/portal/orders/$id" params={{ id: o.id }} className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary">
              <div>
                <h3 className="font-display text-lg">{o.package_name}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Started {new Date(o.created_at).toLocaleDateString()}</span>
                  {o.due_at && <span>· Due {new Date(o.due_at).toLocaleDateString()}</span>}
                  <span>· {o.currency} {Number(o.price).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
