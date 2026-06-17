import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { Workflow } from "lucide-react";

export const Route = createFileRoute("/admin/automation")({ component: Page });

function Page() {
  return (
    <AdminShell title="AI Automation Center" subtitle="Workflows · Agents · Knowledge Base">
      <ComingSoon
        icon={Workflow}
        title="AI Automation"
        description="Hands-free operations powered by AI agents and workflow rules."
        features={[
          "Lovable AI integration",
          "AI lead qualification",
          "AI support agent",
          "AI voice calls",
          "Appointment confirmations",
          "Workflow automation builder",
          "AI reporting",
          "AI knowledge base",
        ]}
      />
    </AdminShell>
  );
}
