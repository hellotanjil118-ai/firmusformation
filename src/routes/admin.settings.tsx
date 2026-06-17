import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: Page });

function Page() {
  return (
    <AdminShell title="Settings" subtitle="Company · Users · Roles · Integrations">
      <ComingSoon
        icon={SettingsIcon}
        title="System Settings"
        description="Configure the entire platform, roles, security and integrations."
        features={[
          "Company settings",
          "Users & roles",
          "Permissions matrix",
          "Departments & services",
          "Pricing catalog",
          "Integrations & API keys",
          "Email & WhatsApp templates",
          "Notification settings",
          "Security & audit logs",
        ]}
      />
    </AdminShell>
  );
}
