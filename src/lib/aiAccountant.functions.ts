import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const askSchema = z.object({
  question: z.string().min(1).max(2000),
});

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

async function buildFinancialSnapshot(supabase: any) {
  const [invRes, ordRes, clientRes, leadRes, campRes, empRes] = await Promise.all([
    supabase.from("invoices").select("status,total,currency,issue_date,paid_at,due_date,created_at"),
    supabase.from("orders").select("status,price,created_at"),
    supabase.from("clients").select("status,created_at"),
    supabase.from("leads").select("status,value,source,created_at"),
    supabase.from("marketing_campaigns").select("name,channel,status,budget,spend"),
    supabase.from("employees").select("status,employment_type,monthly_salary,hourly_rate"),
  ]);

  const invoices = invRes.data ?? [];
  const orders = ordRes.data ?? [];
  const clients = clientRes.data ?? [];
  const leads = leadRes.data ?? [];
  const campaigns = campRes.data ?? [];
  const employees = empRes.data ?? [];

  const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + Number(r[key] ?? 0), 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  return {
    generated_at: now.toISOString(),
    invoices: {
      total_count: invoices.length,
      paid_total: sum(invoices.filter((i: any) => i.status === "paid"), "total"),
      outstanding_total: sum(invoices.filter((i: any) => ["sent", "overdue"].includes(i.status)), "total"),
      overdue_total: sum(invoices.filter((i: any) => i.status === "overdue"), "total"),
      paid_this_month: sum(
        invoices.filter((i: any) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart),
        "total",
      ),
      paid_last_30d: sum(
        invoices.filter((i: any) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= last30),
        "total",
      ),
    },
    orders: {
      total_count: orders.length,
      active_count: orders.filter((o: any) => !["completed", "cancelled"].includes(o.status)).length,
      pipeline_value: sum(orders.filter((o: any) => !["completed", "cancelled"].includes(o.status)), "price"),
    },
    clients: {
      total: clients.length,
      active: clients.filter((c: any) => c.status === "active").length,
      churned: clients.filter((c: any) => c.status === "churned").length,
    },
    leads: {
      total: leads.length,
      new_last_30d: leads.filter((l: any) => new Date(l.created_at) >= last30).length,
      pipeline_value: sum(leads, "value"),
      by_source: leads.reduce((acc: Record<string, number>, l: any) => {
        const k = l.source || "unknown";
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
    },
    marketing: {
      active_campaigns: campaigns.filter((c: any) => c.status === "active").length,
      total_budget: sum(campaigns, "budget"),
      total_spend: sum(campaigns, "spend"),
      by_channel: campaigns.reduce((acc: Record<string, { spend: number; budget: number }>, c: any) => {
        const k = c.channel || "other";
        if (!acc[k]) acc[k] = { spend: 0, budget: 0 };
        acc[k].spend += Number(c.spend ?? 0);
        acc[k].budget += Number(c.budget ?? 0);
        return acc;
      }, {}),
    },
    payroll: {
      headcount: employees.filter((e: any) => e.status === "active").length,
      monthly_salary_cost: sum(
        employees.filter((e: any) => e.status === "active" && e.employment_type !== "contractor"),
        "monthly_salary",
      ),
    },
  };
}

export const getFinancialSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return buildFinancialSnapshot(context.supabase);
  });

export const askAccountant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => askSchema.parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Response("AI not configured", { status: 500 });

    const snapshot = await buildFinancialSnapshot(context.supabase);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are the Firmus AI Accountant / CFO. Give concise, actionable financial insights based on the provided real-time snapshot of the company's finances. Use bullet points. Call out risks (cash-flow, overdue invoices, unprofitable channels, high churn) and 2-3 concrete next actions. Format numbers with currency USD unless specified. Keep answers under 250 words.",
          },
          {
            role: "user",
            content: `Snapshot JSON:\n${JSON.stringify(snapshot)}\n\nQuestion: ${data.question}`,
          },
        ],
      }),
    });

    if (res.status === 429) throw new Response("Rate limit reached. Try again in a moment.", { status: 429 });
    if (res.status === 402) throw new Response("AI credits exhausted. Top up Lovable AI to continue.", { status: 402 });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Response("AI request failed", { status: 500 });
    }
    const json = await res.json();
    const answer = json?.choices?.[0]?.message?.content ?? "No answer.";
    return { answer, snapshot };
  });
