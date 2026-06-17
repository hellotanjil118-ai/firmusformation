import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { CheckSquare } from "lucide-react";

export const Route = createFileRoute("/admin/tasks")({ component: Page });

function Page() {
  return (
    <AdminShell title="Task & Project Management" subtitle="ClickUp-style workspace for the entire company">
      <ComingSoon
        icon={CheckSquare}
        title="Tasks & Projects"
        description="Kanban, calendar and list views with assignment, deadlines, priorities and comments."
        features={[
          "Kanban board (To Do · In Progress · Review · Done)",
          "Calendar view",
          "Task assignment & deadlines",
          "Priorities & labels",
          "Comments & attachments",
          "Real-time notifications",
          "Per-department project rooms",
        ]}
      />
    </AdminShell>
  );
}
