import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { ComingSoon } from "@/components/ComingSoon";
import { FolderOpen } from "lucide-react";

export const Route = createFileRoute("/admin/documents")({ component: Page });

function Page() {
  return (
    <AdminShell title="Document Management" subtitle="Centralized vault for the entire company">
      <ComingSoon
        icon={FolderOpen}
        title="Documents"
        description="Organized folders with versioning, permissions and full-text search."
        features={[
          "LLC, EIN, Trademark & Bank document folders",
          "Contracts & invoices",
          "Employee documents",
          "Version control",
          "Granular permissions",
          "Search & quick share",
        ]}
      />
    </AdminShell>
  );
}
