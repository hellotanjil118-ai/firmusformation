import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, AlertTriangle, TrendingDown, Lightbulb, RefreshCw, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/admin/insights")({
  head: () => ({ meta: [{ title: "Admin — AI Insights" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Insight = {
  id: string;
  cadence: string;
  headline: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  anomalies: string[];
  cashflow_risks: string[];
  recommendations: string[];
  notified_count: number;
  created_at: string;
};

const SEVERITY: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  critical: "bg-red-500/10 text-red-700 border-red-500/30",
};

function Page() {
  const [items, setItems] = useState<Insight[] | null>(null);
  const [running, setRunning] = useState<"daily" | "weekly" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from("ai_insights").select("*").order("created_at", { ascending: false }).limit(50);
    setItems((data as unknown as Insight[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function runNow(cadence: "daily" | "weekly") {
    setRunning(cadence);
    setMsg(null);
    try {
      const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch("/api/public/hooks/generate-insights", {
        method: "POST",
        headers: { "content-type": "application/json", apikey: anon },
        body: JSON.stringify({ cadence }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setMsg(`Digest generated — ${j.notified} admin(s) notified.`);
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Failed to generate");
    } finally {
      setRunning(null);
    }
  }

  return (
    <AdminShell title="AI Insights" subtitle="Scheduled anomaly & cashflow digests">
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock size={14} className="text-muted-foreground" /> Automated Cadence
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Daily digest runs every morning · Weekly digest runs Mondays. Every admin receives an in-app notification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runNow("daily")}
              disabled={!!running}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
            >
              {running === "daily" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Run daily now
            </button>
            <button
              onClick={() => runNow("weekly")}
              disabled={!!running}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {running === "weekly" ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Run weekly now
            </button>
          </div>
        </div>
        {msg && <div className="mt-3 rounded-md bg-secondary p-2 text-xs">{msg}</div>}
      </div>

      {items === null ? (
        <div className="grid h-64 place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No digests generated yet. Click <strong>Run now</strong> to create the first one.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <article key={it.id} className={`rounded-xl border-2 bg-card p-5 ${SEVERITY[it.severity] ?? SEVERITY.info}`}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
                    <span className="rounded-full bg-background/60 px-2 py-0.5 font-semibold">{it.cadence}</span>
                    <span className="rounded-full bg-background/60 px-2 py-0.5 font-semibold">{it.severity}</span>
                    <span className="text-muted-foreground">{new Date(it.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="mt-1 font-display text-lg text-foreground">{it.headline}</h3>
                  <p className="mt-1 text-sm text-foreground/80">{it.summary}</p>
                </div>
                <span className="text-xs text-muted-foreground">{it.notified_count} notified</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <List icon={AlertTriangle} title="Anomalies" items={it.anomalies} tone="text-amber-700" />
                <List icon={TrendingDown} title="Cashflow risks" items={it.cashflow_risks} tone="text-red-700" />
                <List icon={Lightbulb} title="Recommended actions" items={it.recommendations} tone="text-emerald-700" />
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function List({ icon: Icon, title, items, tone }: { icon: any; title: string; items: string[]; tone: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
        <Icon size={12} /> {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None detected.</p>
      ) : (
        <ul className="space-y-1.5 text-xs text-foreground/90">
          {items.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-muted-foreground">•</span><span>{s}</span></li>)}
        </ul>
      )}
    </div>
  );
}
