import { createFileRoute } from "@tanstack/react-router";

// Public cron endpoint. Verifies the Supabase anon key via the `apikey` header,
// then generates an AI-powered insights digest and notifies all admins.
export const Route = createFileRoute("/api/public/hooks/generate-insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("apikey") ?? request.headers.get("Apikey");
        if (!expected || !provided || provided !== expected) {
          return json({ error: "unauthorized" }, 401);
        }

        let body: any = {};
        try { body = await request.json(); } catch {}
        const cadence: "daily" | "weekly" = body?.cadence === "weekly" ? "weekly" : "daily";

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json({ error: "AI not configured" }, 500);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // ---- Snapshot ----
        const [invRes, ordRes, clientRes, leadRes, campRes, empRes] = await Promise.all([
          supabaseAdmin.from("invoices").select("status,total,currency,issue_date,paid_at,due_date,created_at"),
          supabaseAdmin.from("orders").select("status,price,created_at"),
          supabaseAdmin.from("clients").select("status,created_at"),
          supabaseAdmin.from("leads").select("status,value,source,created_at"),
          supabaseAdmin.from("marketing_campaigns").select("name,channel,status,budget,spend"),
          supabaseAdmin.from("employees").select("status,employment_type,monthly_salary"),
        ]);
        const invoices = invRes.data ?? [];
        const orders = ordRes.data ?? [];
        const clients = clientRes.data ?? [];
        const leads = leadRes.data ?? [];
        const campaigns = campRes.data ?? [];
        const employees = empRes.data ?? [];

        const now = new Date();
        const windowDays = cadence === "weekly" ? 14 : 7;
        const windowStart = new Date(now.getTime() - windowDays * 86400_000);
        const halfStart = new Date(now.getTime() - (windowDays / 2) * 86400_000);
        const sum = (a: any[], k: string) => a.reduce((s, r) => s + Number(r[k] ?? 0), 0);

        const revNow = sum(invoices.filter((i: any) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= halfStart), "total");
        const revPrev = sum(invoices.filter((i: any) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= windowStart && new Date(i.paid_at) < halfStart), "total");
        const overdue = invoices.filter((i: any) => i.status === "overdue");
        const outstanding = invoices.filter((i: any) => ["sent", "overdue"].includes(i.status));
        const payroll = sum(employees.filter((e: any) => e.status === "active" && e.employment_type !== "contractor"), "monthly_salary");
        const marketingSpend = sum(campaigns, "spend");

        const snapshot = {
          generated_at: now.toISOString(),
          cadence,
          revenue: { current_half: revNow, previous_half: revPrev, delta: revNow - revPrev },
          invoices: {
            overdue_count: overdue.length,
            overdue_total: sum(overdue, "total"),
            outstanding_total: sum(outstanding, "total"),
          },
          costs: { monthly_payroll: payroll, marketing_spend: marketingSpend },
          pipeline: {
            active_orders: orders.filter((o: any) => !["completed", "cancelled"].includes(o.status)).length,
            new_leads: leads.filter((l: any) => new Date(l.created_at) >= windowStart).length,
            churned_clients: clients.filter((c: any) => c.status === "churned").length,
          },
          marketing_by_channel: campaigns.reduce((acc: Record<string, { spend: number; budget: number }>, c: any) => {
            const k = c.channel || "other";
            if (!acc[k]) acc[k] = { spend: 0, budget: 0 };
            acc[k].spend += Number(c.spend ?? 0);
            acc[k].budget += Number(c.budget ?? 0);
            return acc;
          }, {}),
        };

        // ---- AI ----
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "You are Firmus's CFO analyst. From the JSON snapshot, produce a concise digest with concrete numbers. Reply ONLY with JSON matching this schema and no markdown fences: {\"headline\": string (<=90 chars, punchy), \"summary\": string (<=300 chars), \"severity\": \"info\"|\"warning\"|\"critical\", \"anomalies\": string[] (0-5 items), \"cashflow_risks\": string[] (0-5 items focused on overdue, runway, cost spikes), \"recommendations\": string[] (2-4 items, actionable, imperative)}. Use USD.",
              },
              { role: "user", content: `Cadence: ${cadence}\nSnapshot:\n${JSON.stringify(snapshot)}` },
            ],
          }),
        });

        if (!aiRes.ok) {
          const t = await aiRes.text();
          console.error("AI gateway error", aiRes.status, t);
          return json({ error: "ai_failed", status: aiRes.status }, 500);
        }
        const aiJson = await aiRes.json();
        const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
        const cleaned = String(raw).replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        let parsed: any;
        try { parsed = JSON.parse(cleaned); } catch {
          return json({ error: "parse_failed", raw: cleaned.slice(0, 500) }, 500);
        }

        const headline = String(parsed.headline ?? "Financial digest").slice(0, 120);
        const summary = String(parsed.summary ?? "");
        const severity = ["info", "warning", "critical"].includes(parsed.severity) ? parsed.severity : "info";
        const anomalies = Array.isArray(parsed.anomalies) ? parsed.anomalies.slice(0, 5).map(String) : [];
        const risks = Array.isArray(parsed.cashflow_risks) ? parsed.cashflow_risks.slice(0, 5).map(String) : [];
        const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4).map(String) : [];

        // ---- Persist ----
        const { data: inserted, error: insErr } = await supabaseAdmin
          .from("ai_insights")
          .insert({
            cadence, headline, summary, severity,
            anomalies, cashflow_risks: risks, recommendations: recs,
            snapshot,
          })
          .select("id")
          .single();
        if (insErr) return json({ error: insErr.message }, 500);

        // ---- Notify admins ----
        const { data: admins } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
        let notified = 0;
        if (admins?.length) {
          const rows = admins.map((a: any) => ({
            user_id: a.user_id,
            title: `${severity === "critical" ? "🚨 " : severity === "warning" ? "⚠️ " : "📊 "}${headline}`,
            body: summary,
            link: `/admin/insights?id=${inserted!.id}`,
          }));
          const { error: nErr } = await supabaseAdmin.from("notifications").insert(rows);
          if (!nErr) notified = rows.length;
        }
        await supabaseAdmin.from("ai_insights").update({ notified_count: notified }).eq("id", inserted!.id);

        return json({ ok: true, insight_id: inserted!.id, severity, notified });
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
