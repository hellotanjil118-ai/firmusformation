import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/admin/ai-accountant")({ component: Page });

function Page() {
  return (
    <AdminShell title="AI Accountant" subtitle="Your always-on CFO">
      <ComingSoon
        icon={Bot}
        title="AI CFO"
        description="Forecasts, alerts and optimization powered by Lovable AI."
        features={[
          "Revenue & profit forecasting",
          "Payroll & expense monitoring",
          "Cash flow prediction",
          "Budget optimization",
          "Invoice automation",
          "Tax assistant",
          "Cost reduction recommendations",
          "Department profitability analysis",
          "Financial health score",
          "Ask the AI Accountant",
        ]}
      />
    </AdminShell>
  );
}
