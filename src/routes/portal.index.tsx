import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Phone, Building2, MapPin, FileText, Receipt } from "lucide-react";

export const Route = createFileRoute("/portal/")({
  head: () => ({ meta: [{ title: "My Dashboard — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalHome,
});

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  status: string;
};

function PortalHome() {
  const { user, isAdmin } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await supabase.rpc("claim_client_by_email" as never);
      const { data } = await supabase.from("clients").select("*").eq("user_id", user.id).maybeSingle();
      setClient(data as Client | null);
      const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).not("status", "in", "(closed,cancelled,delivered)");
      setActiveCount(count ?? 0);
      setLoading(false);
    })();
  }, [user]);

  return (
    <PortalShell title={`Welcome${client ? ", " + client.name.split(" ")[0] : ""}`}>
      {isAdmin && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          You're signed in as an admin. <Link to="/admin" className="font-semibold text-primary hover:underline">Go to admin panel →</Link>
        </div>
      )}

      {loading ? <Loader2 className="animate-spin" /> : !client ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-display text-lg">Your account isn't linked yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We don't have a client record matching <strong>{user?.email}</strong>. Please contact us so we can set up your portal access.
          </p>
          <a href="mailto:hello@firmusformation.com" className="mt-4 inline-block rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold">
            Contact support
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat icon={FileText} label="Active Orders" value="—" hint="Coming in Batch 2" />
            <Stat icon={Receipt} label="Open Invoices" value="—" hint="Coming in Batch 3" />
            <Stat icon={Building2} label="Account Status" value={client.status} hint="" />
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg">Your details</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Row icon={Mail} label="Email" value={client.email} />
              <Row icon={Phone} label="Phone" value={client.phone || "—"} />
              <Row icon={Building2} label="Company" value={client.company || "—"} />
              <Row icon={MapPin} label="Country" value={client.country || "—"} />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Your order timeline, invoices, and documents will appear here as your service progresses.
          </div>
        </div>
      )}
    </PortalShell>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Mail; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} /> {label}</div>
      <p className="mt-2 font-display text-2xl capitalize">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
