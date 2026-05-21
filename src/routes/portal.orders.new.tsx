import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/portal/orders/new")({
  head: () => ({ meta: [{ title: "Order a Service — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: NewOrder,
});

type Svc = { id: string; slug: string; title: string; description: string; features: string[] };

function NewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Svc[] | null>(null);
  const [selected, setSelected] = useState<Svc | null>(null);
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (user) await supabase.rpc("claim_client_by_email" as never);
      const { data } = await supabase.from("services").select("id,slug,title,description,features").eq("published", true).order("order_index");
      setServices((data as Svc[]) ?? []);
    })();
  }, [user]);

  const submit = async () => {
    if (!selected || !user) return;
    setSubmitting(true); setError(null);
    const { data: client } = await supabase.from("clients").select("id").eq("user_id", user.id).maybeSingle();
    if (!client) { setError("Your account isn't linked to a client record yet. Contact support."); setSubmitting(false); return; }
    const { data: order, error: err } = await supabase.from("orders").insert({
      client_id: client.id,
      service_id: selected.id,
      package_name: selected.title,
      price: Number(price) || 0,
      currency: "USD",
      status: "pending",
      notes: notes || null,
    }).select("id").single();
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    navigate({ to: "/portal/orders/$id", params: { id: order!.id } });
  };

  return (
    <PortalShell title="Order a Service">
      {services === null ? <Loader2 className="animate-spin" /> : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-sm uppercase tracking-wide text-muted-foreground">1. Choose a service</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button key={s.id} onClick={() => setSelected(s)} className={`rounded-xl border p-4 text-left transition-all ${selected?.id === s.id ? "border-primary bg-primary/5 shadow-elegant" : "border-border bg-card hover:border-primary/50"}`}>
                  <div className="flex items-start justify-between">
                    <h3 className="font-display">{s.title}</h3>
                    {selected?.id === s.id && <Check size={18} className="text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="space-y-4 rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-sm uppercase tracking-wide text-muted-foreground">2. Details</h2>
              <div>
                <label className="mb-1 block text-sm font-medium">Budget / quoted price (USD)</label>
                <input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <p className="mt-1 text-xs text-muted-foreground">Leave 0 if you'd like our team to confirm pricing.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes for our team</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Tell us about your project, timeline, or any specific requirements." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Place order
              </button>
            </div>
          )}
        </div>
      )}
    </PortalShell>
  );
}
