import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { refreshBrandSettings } from "@/hooks/useBrand";
import {
  Building2, Bell, Shield, Users as UsersIcon, KeyRound, Receipt, Loader2, Save, UserPlus, Trash2, RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Firmus Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Settings = {
  id?: string;
  company_name: string;
  legal_name: string | null;
  tagline: string | null;
  contact_email: string | null;
  support_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  tax_id: string | null;
  currency: string;
  timezone: string;
  logo_url: string | null;
  brand_primary: string | null;
  invoice_prefix: string | null;
  invoice_footer: string | null;
  invoice_terms: string | null;
  notify_new_leads: boolean;
  notify_new_orders: boolean;
  notify_new_tickets: boolean;
  notify_invoice_paid: boolean;
  insights_cadence: string;
  social_links: Record<string, string>;
};

const EMPTY: Settings = {
  company_name: "Firmus Formation",
  legal_name: null, tagline: null, contact_email: null, support_email: null,
  contact_phone: null, whatsapp_number: null, website_url: null,
  address_line1: null, address_line2: null, city: null, state: null,
  postal_code: null, country: null, tax_id: null,
  currency: "USD", timezone: "UTC", logo_url: null, brand_primary: null,
  invoice_prefix: "INV", invoice_footer: null, invoice_terms: null,
  notify_new_leads: true, notify_new_orders: true, notify_new_tickets: true, notify_invoice_paid: true,
  insights_cadence: "weekly", social_links: {},
};

type Profile = { user_id: string; email: string | null };
type Role = { id: string; user_id: string; role: string };

function Page() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "employee">("admin");

  const [audit, setAudit] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => { void loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [s, p, r, aa, al] = await Promise.all([
      supabase.from("company_settings").select("*").eq("singleton", true).maybeSingle(),
      supabase.from("profiles").select("user_id, email").order("email", { ascending: true }),
      supabase.from("user_roles").select("id, user_id, role"),
      supabase.from("employee_assignment_audit").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(25),
    ]);
    if (s.data) setSettings({ ...EMPTY, ...(s.data as any), social_links: (s.data as any).social_links || {} });
    setProfiles((p.data as any) || []);
    setRoles((r.data as any) || []);
    setAudit((aa.data as any) || []);
    setActivity((al.data as any) || []);
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    const { id, ...rest } = settings;
    const payload = { ...rest, singleton: true };
    const q = id
      ? supabase.from("company_settings").update(payload).eq("id", id)
      : supabase.from("company_settings").upsert(payload as any, { onConflict: "singleton" });
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      await refreshBrandSettings();
      toast.success("Settings saved");
      void loadAll();
    }
  };

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  const grantRole = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;
    const prof = profiles.find((p) => (p.email || "").toLowerCase() === email);
    if (!prof) return toast.error("No account with that email — user must sign up first");
    const { error } = await supabase.from("user_roles").insert({ user_id: prof.user_id, role: newRole as any });
    if (error) return toast.error(error.message);
    toast.success(`Granted ${newRole}`);
    setNewEmail("");
    void loadAll();
  };

  const revokeRole = async (r: Role) => {
    if (r.user_id === user?.id && r.role === "admin") {
      const adminCount = roles.filter((x) => x.role === "admin").length;
      if (adminCount <= 1) return toast.error("You can't remove the last admin");
    }
    if (!confirm(`Revoke ${r.role}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Role revoked");
    void loadAll();
  };

  const rolesByUser = useMemo(() => {
    const m: Record<string, Role[]> = {};
    for (const r of roles) (m[r.user_id] ||= []).push(r);
    return m;
  }, [roles]);

  if (loading) {
    return (
      <AdminShell title="Settings" subtitle="Company · Users · Notifications · Security">
        <div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="System Settings" subtitle="Configure company, users, notifications and security">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="company"><Building2 size={14} className="mr-1.5" /> Company</TabsTrigger>
          <TabsTrigger value="invoicing"><Receipt size={14} className="mr-1.5" /> Invoicing</TabsTrigger>
          <TabsTrigger value="notifications"><Bell size={14} className="mr-1.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon size={14} className="mr-1.5" /> Users & Roles</TabsTrigger>
          <TabsTrigger value="integrations"><KeyRound size={14} className="mr-1.5" /> Integrations</TabsTrigger>
          <TabsTrigger value="security"><Shield size={14} className="mr-1.5" /> Security & Audit</TabsTrigger>
        </TabsList>

        {/* COMPANY */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Company profile</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Company name"><Input value={settings.company_name} onChange={(e) => set("company_name", e.target.value)} /></Field>
              <Field label="Legal name"><Input value={settings.legal_name || ""} onChange={(e) => set("legal_name", e.target.value)} /></Field>
              <Field label="Tagline" full><Input value={settings.tagline || ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
              <Field label="Contact email"><Input type="email" value={settings.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} /></Field>
              <Field label="Support email"><Input type="email" value={settings.support_email || ""} onChange={(e) => set("support_email", e.target.value)} /></Field>
              <Field label="Phone"><Input value={settings.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
              <Field label="WhatsApp number"><Input value={settings.whatsapp_number || ""} onChange={(e) => set("whatsapp_number", e.target.value)} /></Field>
              <Field label="Website URL" full><Input value={settings.website_url || ""} onChange={(e) => set("website_url", e.target.value)} /></Field>
              <Field label="Logo URL" full><Input value={settings.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." /></Field>
              <Field label="Currency">
                <Select value={settings.currency} onValueChange={(v) => set("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "AED", "PKR", "INR", "SAR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Timezone"><Input value={settings.timezone} onChange={(e) => set("timezone", e.target.value)} /></Field>
              <Field label="Tax / VAT ID"><Input value={settings.tax_id || ""} onChange={(e) => set("tax_id", e.target.value)} /></Field>
              <Field label="Brand primary color"><Input value={settings.brand_primary || ""} onChange={(e) => set("brand_primary", e.target.value)} placeholder="#0F172A" /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Address line 1" full><Input value={settings.address_line1 || ""} onChange={(e) => set("address_line1", e.target.value)} /></Field>
              <Field label="Address line 2" full><Input value={settings.address_line2 || ""} onChange={(e) => set("address_line2", e.target.value)} /></Field>
              <Field label="City"><Input value={settings.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="State/Region"><Input value={settings.state || ""} onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="Postal code"><Input value={settings.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} /></Field>
              <Field label="Country"><Input value={settings.country || ""} onChange={(e) => set("country", e.target.value)} /></Field>
            </CardContent>
          </Card>

          <SaveBar saving={saving} onSave={save} />
        </TabsContent>

        {/* INVOICING */}
        <TabsContent value="invoicing" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Invoicing defaults</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Invoice number prefix"><Input value={settings.invoice_prefix || ""} onChange={(e) => set("invoice_prefix", e.target.value)} /></Field>
              <Field label="Default currency"><Input value={settings.currency} onChange={(e) => set("currency", e.target.value)} /></Field>
              <Field label="Invoice footer" full><Textarea rows={3} value={settings.invoice_footer || ""} onChange={(e) => set("invoice_footer", e.target.value)} placeholder="Thank you for your business" /></Field>
              <Field label="Payment terms" full><Textarea rows={4} value={settings.invoice_terms || ""} onChange={(e) => set("invoice_terms", e.target.value)} placeholder="Net 15. Late fees may apply..." /></Field>
            </CardContent>
          </Card>
          <SaveBar saving={saving} onSave={save} />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Admin notifications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ToggleRow label="New leads" desc="Notify admins when a new lead comes in" v={settings.notify_new_leads} onChange={(v) => set("notify_new_leads", v)} />
              <ToggleRow label="New orders" desc="Notify admins when a client places an order" v={settings.notify_new_orders} onChange={(v) => set("notify_new_orders", v)} />
              <ToggleRow label="New support tickets" desc="Notify admins when a ticket is opened" v={settings.notify_new_tickets} onChange={(v) => set("notify_new_tickets", v)} />
              <ToggleRow label="Invoice paid" desc="Notify admins when an invoice is marked paid" v={settings.notify_invoice_paid} onChange={(v) => set("notify_invoice_paid", v)} />
              <div className="pt-2">
                <Label className="mb-2 block">AI insights cadence</Label>
                <Select value={settings.insights_cadence} onValueChange={(v) => set("insights_cadence", v)}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <SaveBar saving={saving} onSave={save} />
        </TabsContent>

        {/* USERS & ROLES */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Grant role</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label className="mb-1 block">User email</Label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="w-full sm:w-48">
                <Label className="mb-1 block">Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={grantRole}><UserPlus size={14} className="mr-1.5" /> Grant</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({profiles.length})</span>
                <Button variant="ghost" size="sm" onClick={() => void loadAll()}><RefreshCw size={12} className="mr-1.5" /> Refresh</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">Email</th><th>Roles</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {profiles.map((p) => {
                    const userRoles = rolesByUser[p.user_id] || [];
                    return (
                      <tr key={p.user_id} className="border-t border-border">
                        <td className="py-2.5">{p.email || <span className="text-muted-foreground">—</span>}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length === 0 && <Badge variant="secondary">client</Badge>}
                            {userRoles.map((r) => (
                              <Badge key={r.id} variant={r.role === "admin" ? "default" : "secondary"}>{r.role}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="text-right">
                          {userRoles.map((r) => (
                            <Button key={r.id} variant="ghost" size="sm" onClick={() => revokeRole(r)}>
                              <Trash2 size={12} className="mr-1" /> {r.role}
                            </Button>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                  {profiles.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No users yet</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Connected integrations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <IntegrationRow name="Lovable AI Gateway" desc="Powers AI insights, accountant and automations" status="connected" />
              <IntegrationRow name="Supabase Cloud" desc="Database, auth and storage" status="connected" />
              <IntegrationRow name="Email (transactional)" desc="Configure a provider to send outbound emails" status="not-configured" />
              <IntegrationRow name="WhatsApp Business API" desc="Send WhatsApp notifications to clients" status="not-configured" />
              <IntegrationRow name="Stripe payments" desc="Accept card payments on invoices" status="not-configured" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY & AUDIT */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Employee assignment audit</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">When</th><th>Action</th><th>Employee</th><th>From</th><th>To</th><th>By</th></tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                      <td><Badge variant="secondary">{a.action}</Badge></td>
                      <td>{a.employee_name}</td>
                      <td className="text-muted-foreground">{a.from_department_name || a.from_status || "—"}</td>
                      <td>{a.to_department_name || a.to_status || "—"}</td>
                      <td className="text-xs text-muted-foreground">{a.changed_by_email || "system"}</td>
                    </tr>
                  ))}
                  {audit.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No entries</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="py-2">When</th><th>Action</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                      <td>{a.action}</td>
                      <td className="text-xs text-muted-foreground">{a.details ? JSON.stringify(a.details).slice(0, 120) : "—"}</td>
                    </tr>
                  ))}
                  {activity.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No activity yet</td></tr>}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, v, onChange }: { label: string; desc: string; v: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={v} onCheckedChange={onChange} />
    </div>
  );
}

function SaveBar({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="sticky bottom-4 flex justify-end">
      <Button onClick={onSave} disabled={saving} className="shadow-elegant">
        {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
        Save changes
      </Button>
    </div>
  );
}

function IntegrationRow({ name, desc, status }: { name: string; desc: string; status: "connected" | "not-configured" }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Badge variant={status === "connected" ? "default" : "secondary"}>
        {status === "connected" ? "Connected" : "Not configured"}
      </Badge>
    </div>
  );
}
