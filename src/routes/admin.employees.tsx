import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { UserCog } from "lucide-react";

export const Route = createFileRoute("/admin/employees")({ component: Page });

function Page() {
  return (
    <AdminShell title="Employee Management" subtitle="Profiles · Attendance · Performance · Payroll">
      <ComingSoon
        icon={UserCog}
        title="Employees"
        description="Full HR suite for managing the Firmus team across every department."
        features={[
          "Employee profiles & org chart",
          "Attendance tracking",
          "Performance reviews & rankings",
          "Department & manager assignment",
          "Salary management",
          "Promotion history",
          "Disciplinary records",
          "Leave requests",
          "Productivity tracking",
        ]}
      />
    </AdminShell>
  );
}
