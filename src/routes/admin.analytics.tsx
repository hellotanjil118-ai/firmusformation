import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: Page });

function Page() {
  return (
    <AdminShell title="Analytics Center" subtitle="Every metric, one place">
      <ComingSoon
        icon={BarChart3}
        title="Analytics"
        description="Slice the business by team, channel, client or service."
        features={[
          "Executive analytics",
          "Employee analytics",
          "Department analytics",
          "Client analytics",
          "Revenue & sales analytics",
          "Marketing analytics",
          "Support analytics",
          "Finance analytics",
          "Operations analytics",
          "Growth analytics",
        ]}
      />
    </AdminShell>
  );
}
