import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  DollarSign,
  Trash2,
  Loader2,
  Phone as PhoneIcon,
  MessageSquare,
  MailIcon,
  Calendar,
  StickyNote,
  Save,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads/$id")({
  head: () => ({ meta: [{ title: "Admin — Lead" }, { name: "robots", content: "noindex" }] }),
  component: LeadDetailPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  service: string | null;
  source: string | null;
  status: string;
  value: number | null;
  notes: string | null;
  message: string;
  created_at: string;
};

type Activity = {
  id: string;
  kind: string;
  body: string | null;
  created_at: string;
};

const STAGES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const KIND_ICONS: Record<string, typeof PhoneIcon> = {
  call: PhoneIcon,
  email: MailIcon,
  whatsapp: MessageSquare,
  meeting: Calendar,
  note: StickyNote,
  stage_change: ArrowLeft,
};

function LeadDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logKind, setLogKind] = useState("call");
  const [logBody, setLogBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [l, a] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).maybeSingle(),
      supabase.from("lead_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    setLead((l.data as Lead) ?? null);
    setActivities((a.data as Activity[]) ?? []);
  };
  useEffect(() => {
    load();
  }, [id]);

  const updateField = async (patch: Partial<Lead>) => {
    if (!lead) return;
    setLead({ ...lead, ...patch });
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const moveStage = async (status: string) => {
    await updateField({ status });
    await supabase.from("lead_activities").insert({ lead_id: id, kind: "stage_change", body: `Moved to ${status}` });
    load();
  };

  const saveNotes = async () => {
    setSaving(true);
    await supabase.from("leads").update({ notes: lead?.notes }).eq("id", id);
    setSaving(false);
    toast.success("Notes saved");
  };

  const logActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logBody.trim()) return;
    const { error } = await supabase.from("lead_activities").insert({ lead_id: id, kind: logKind, body: logBody });
    if (error) return toast.error(error.message);
    setLogBody("");
    load();
  };

  const remove = async () => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    navigate({ to: "/admin/leads" });
  };

  if (!lead)
    return (
      <AdminShell title="Lead">
        <Loader2 className="animate-spin text-muted-foreground" />
      </AdminShell>
    );

  return (
    <AdminShell title={lead.name} subtitle={lead.company ?? lead.email}>
      <Link to="/admin/leads" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft size={12} /> Back to pipeline
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: profile */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-sm uppercase tracking-wide text-muted-foreground">Contact</h3>
            <div className="space-y-2 text-sm">
              <Row icon={Mail} label="Email" value={<a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>} />
              {lead.phone && (
                <Row icon={Phone} label="Phone" value={<a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>} />
              )}
              {lead.company && <Row icon={Building2} label="Company" value={lead.company} />}
              {lead.country && <Row icon={Globe} label="Country" value={lead.country} />}
              {lead.value ? (
                <Row icon={DollarSign} label="Deal value" value={`$${Number(lead.value).toLocaleString()}`} />
              ) : null}
              {lead.source && <Row icon={StickyNote} label="Source" value={lead.source} />}
              {lead.service && <Row icon={Building2} label="Interested in" value={lead.service} />}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-1 text-xs text-muted-foreground">Pipeline stage</div>
              <select
                value={lead.status}
                onChange={(e) => moveStage(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <div className="mb-1 text-xs text-muted-foreground">Deal value</div>
              <input
                type="number"
                value={lead.value ?? ""}
                onChange={(e) => setLead({ ...lead, value: e.target.value ? Number(e.target.value) : null })}
                onBlur={(e) => updateField({ value: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={remove}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={12} /> Delete lead
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 font-display text-sm uppercase tracking-wide text-muted-foreground">Original Message</h3>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{lead.message}</p>
          </div>
        </div>

        {/* Right: activity + notes */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-lg">Log Activity</h3>
            <form onSubmit={logActivity} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "call", label: "Call", icon: PhoneIcon },
                  { id: "email", label: "Email", icon: MailIcon },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  { id: "meeting", label: "Meeting", icon: Calendar },
                  { id: "note", label: "Note", icon: StickyNote },
                ].map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setLogKind(k.id)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs ${
                      logKind === k.id
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <k.icon size={12} /> {k.label}
                  </button>
                ))}
              </div>
              <textarea
                value={logBody}
                onChange={(e) => setLogBody(e.target.value)}
                placeholder={`What happened in this ${logKind}?`}
                rows={2}
                className="w-full rounded-lg border border-input bg-background p-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
              >
                Log {logKind}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg">Internal Notes</h3>
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary"
              >
                <Save size={12} /> {saving ? "Saving…" : "Save"}
              </button>
            </div>
            <textarea
              value={lead.notes ?? ""}
              onChange={(e) => setLead({ ...lead, notes: e.target.value })}
              placeholder="Internal notes about this lead…"
              rows={4}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-display text-lg">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => {
                  const Icon = KIND_ICONS[a.kind] ?? StickyNote;
                  return (
                    <div key={a.id} className="flex gap-3 border-l-2 border-primary/30 pl-3">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {a.kind.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        {a.body && <p className="mt-1 text-sm">{a.body}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
