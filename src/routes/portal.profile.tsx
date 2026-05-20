import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/PortalShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Save, KeyRound, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/portal/profile")({
  head: () => ({ meta: [{ title: "My Profile — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalProfile,
});

type Client = { id: string; name: string; phone: string | null; company: string | null; country: string | null };

function PortalProfile() {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("clients").select("id,name,phone,company,country").eq("user_id", user.id).maybeSingle();
      setClient(data as Client | null);
      setLoading(false);
    })();
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    setSaved(false);
    await supabase.from("clients").update({
      name: client.name,
      phone: client.phone,
      company: client.company,
      country: client.country,
    }).eq("id", client.id);
    await supabase.from("activity_logs").insert({ user_id: user!.id, client_id: client.id, action: "profile_updated" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sendReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
    setResetMsg(error ? error.message : "Password reset email sent. Check your inbox.");
    setTimeout(() => setResetMsg(null), 4000);
  };

  if (loading) return <PortalShell title="Profile"><Loader2 className="animate-spin" /></PortalShell>;
  if (!client) return <PortalShell title="Profile"><p className="text-muted-foreground">Your account isn't linked to a client record yet.</p></PortalShell>;

  return (
    <PortalShell title="My Profile">
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="space-y-4 rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg">Personal Details</h2>
          <Field label="Full name" value={client.name} onChange={(v) => setClient({ ...client, name: v })} required />
          <Field label="Phone" value={client.phone ?? ""} onChange={(v) => setClient({ ...client, phone: v })} />
          <Field label="Company" value={client.company ?? ""} onChange={(v) => setClient({ ...client, company: v })} />
          <Field label="Country" value={client.country ?? ""} onChange={(v) => setClient({ ...client, country: v })} />
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-4 py-2 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
            </button>
            {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 size={14} /> Saved</span>}
          </div>
        </form>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">Security</h2>
          <p className="text-sm text-muted-foreground">Email: <span className="font-medium text-foreground">{user?.email}</span></p>
          <button onClick={sendReset} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary">
            <KeyRound size={14} /> Send password reset email
          </button>
          {resetMsg && <p className="text-xs text-muted-foreground">{resetMsg}</p>}
        </div>
      </div>
    </PortalShell>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </div>
  );
}
