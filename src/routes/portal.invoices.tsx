import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/PortalShell";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/portal/invoices")({
  head: () => ({ meta: [{ title: "Invoices — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell title="Invoices & Payments">
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Receipt className="mx-auto mb-3 text-muted-foreground" />
        <p className="font-display text-lg">No invoices yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Once an invoice is generated for your service, it will appear here for download.</p>
      </div>
    </PortalShell>
  ),
});
