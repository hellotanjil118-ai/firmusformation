import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/admin/inbox")({ component: Page });

function Page() {
  return (
    <AdminShell title="Communication Center" subtitle="Unified inbox across every channel">
      <ComingSoon
        icon={MessagesSquare}
        title="Unified Inbox"
        description="One thread per client across website chat, WhatsApp, email and internal chat."
        features={[
          "Website chat",
          "WhatsApp Business",
          "Email integration",
          "Internal team chat",
          "Conversation history",
          "Team assignment & routing",
          "Message templates",
          "Broadcast campaigns",
        ]}
      />
    </AdminShell>
  );
}
