import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Firmus Formation" },
      { name: "description", content: "Terms governing the use of Firmus Formation services and website." },
      { property: "og:title", content: "Terms & Conditions — Firmus Formation" },
      { property: "og:description", content: "Terms for Firmus Formation services and website use." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteShell>
      <PageHero eyebrow="Legal" title="Terms & Conditions" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-muted-foreground leading-relaxed">
        <p>By accessing or using Firmus Formation services, you agree to these Terms.</p>
        <h2 className="font-display text-2xl text-foreground">Services</h2>
        <p>Service scope, deliverables, and timelines are defined in your individual proposal. Government processing times are outside our control.</p>
        <h2 className="font-display text-2xl text-foreground">Payments & Refunds</h2>
        <p>Fees are due as scheduled in your proposal. Milestone-based refunds apply if a defined deliverable is not met. Government filing fees are non-refundable.</p>
        <h2 className="font-display text-2xl text-foreground">Client responsibilities</h2>
        <p>You agree to provide accurate information and required documents in a timely manner. Delays caused by missing documents are not our responsibility.</p>
        <h2 className="font-display text-2xl text-foreground">Limitation of liability</h2>
        <p>Firmus Formation is not liable for indirect or consequential damages. Our maximum liability is limited to fees paid for the relevant service.</p>
        <p className="text-sm">Last updated: May 10, 2026.</p>
      </section>
    </SiteShell>
  );
}
