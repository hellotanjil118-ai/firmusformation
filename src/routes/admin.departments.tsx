import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/admin/departments")({ component: Page });

function Page() {
  return (
    <AdminShell title="Department Management" subtitle="Amazon · Documentation · Marketing · Sales · Support · Finance · HR · AI">
      <ComingSoon
        icon={Building2}
        title="Departments"
        description="Each department gets a dedicated dashboard with employees, tasks, revenue, projects, KPIs and analytics."
        features={[
          "Amazon Department (Research, PPC, Listings, Launch, Account Mgmt)",
          "Documentation (LLC, EIN, Trademark, Bank Account)",
          "Marketing Department",
          "Sales Department",
          "Support Department",
          "Finance Department",
          "HR Department",
          "AI Automation Department",
          "Per-department KPIs & profitability",
        ]}
      />
    </AdminShell>
  );
}
