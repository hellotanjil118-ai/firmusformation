import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { askAccountant, getFinancialSnapshot } from "@/lib/aiAccountant.functions";
import { Bot, Send, Loader2, TrendingUp, AlertTriangle, DollarSign, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/ai-accountant")({
  head: () => ({ meta: [{ title: "Admin — AI Accountant" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const SUGGESTIONS = [
  "What's my cash-flow risk this month?",
  "Which marketing channel gives the best ROI right now?",
  "How can I reduce costs without cutting headcount?",
  "Am I on track to hit revenue targets?",
];

type Message = { role: "user" | "assistant"; content: string };

function Page() {
  const snapshotFn = useServerFn(getFinancialSnapshot);
  const askFn = useServerFn(askAccountant);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: snap } = useQuery({
    queryKey: ["financial-snapshot"],
    queryFn: () => snapshotFn(),
    refetchInterval: 60_000,
  });

  async function send(q: string) {
    if (!q.trim() || busy) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await askFn({ data: { question: q } });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to reach AI");
    } finally {
      setBusy(false);
    }
  }

  const revenueMonth = snap?.invoices.paid_this_month ?? 0;
  const outstanding = snap?.invoices.outstanding_total ?? 0;
  const overdue = snap?.invoices.overdue_total ?? 0;
  const payroll = snap?.payroll.monthly_salary_cost ?? 0;
  const marketingSpend = snap?.marketing.total_spend ?? 0;
  const net = revenueMonth - payroll - marketingSpend;

  return (
    <AdminShell title="AI Accountant" subtitle="Your always-on CFO powered by Lovable AI">
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Kpi label="Revenue this month" value={`$${revenueMonth.toLocaleString()}`} icon={DollarSign} tone="emerald" />
        <Kpi label="Outstanding" value={`$${outstanding.toLocaleString()}`} icon={TrendingUp} tone="blue" />
        <Kpi label="Overdue" value={`$${overdue.toLocaleString()}`} icon={AlertTriangle} tone="red" />
        <Kpi label="Estimated net (month)" value={`$${net.toLocaleString()}`} icon={Sparkles} tone={net >= 0 ? "emerald" : "red"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Bot size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm">Firmus CFO</div>
              <div className="text-xs text-muted-foreground">Answers grounded in your live financial data</div>
            </div>
          </div>

          <div className="flex h-[480px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <Bot size={40} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Ask anything about revenue, costs, cash flow, or growth.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => send(s)} className="rounded-full border border-input px-3 py-1.5 text-xs hover:bg-secondary">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Analyzing your books...
                </div>
              )}
              {error && <div className="rounded-md bg-red-500/10 p-2 text-xs text-red-600">{error}</div>}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI Accountant..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <SnapshotCard title="Payroll" icon={Users}>
            <Row label="Active headcount" value={String(snap?.payroll.headcount ?? 0)} />
            <Row label="Monthly salary cost" value={`$${payroll.toLocaleString()}`} />
          </SnapshotCard>
          <SnapshotCard title="Marketing" icon={TrendingUp}>
            <Row label="Active campaigns" value={String(snap?.marketing.active_campaigns ?? 0)} />
            <Row label="Total spend" value={`$${marketingSpend.toLocaleString()}`} />
            <Row label="Total budget" value={`$${(snap?.marketing.total_budget ?? 0).toLocaleString()}`} />
          </SnapshotCard>
          <SnapshotCard title="Pipeline" icon={DollarSign}>
            <Row label="Active orders" value={String(snap?.orders.active_count ?? 0)} />
            <Row label="Pipeline value" value={`$${(snap?.orders.pipeline_value ?? 0).toLocaleString()}`} />
            <Row label="Open leads (30d)" value={String(snap?.leads.new_last_30d ?? 0)} />
          </SnapshotCard>
        </div>
      </div>
    </AdminShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-600 bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    red: "text-red-600 bg-red-500/10",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`rounded-lg p-2 ${tones[tone]}`}><Icon size={14} /></span>
      </div>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

function SnapshotCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon size={14} className="text-muted-foreground" /> {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
