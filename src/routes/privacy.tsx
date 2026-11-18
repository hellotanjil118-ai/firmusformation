import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Firmus Formation" },
      { name: "description", content: "How Firmus Formation collects, uses and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Firmus Formation" },
      { property: "og:description", content: "How Firmus Formation handles and protects your information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteShell>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-muted-foreground leading-relaxed">
        <p>This Privacy Policy describes how Firmus Formation ("we", "us") collects, uses, and shares information when you use our website and services.</p>
        <h2 className="font-display text-2xl text-foreground">Information we collect</h2>
        <p>We collect contact details you submit (name, email, phone), service preferences, and any information you share during onboarding. We also collect basic analytics like pages visited and device type.</p>
        <h2 className="font-display text-2xl text-foreground">How we use information</h2>
        <p>To provide our services, respond to inquiries, comply with legal obligations, and improve our website.</p>
        <h2 className="font-display text-2xl text-foreground">Sharing</h2>
        <p>We never sell your data. We may share with trusted vendors (registered agents, IRS filers, payment providers) strictly to deliver the service you requested.</p>
        <h2 className="font-display text-2xl text-foreground">Your rights</h2>
        <p>You may request access, correction or deletion of your personal data by emailing hello@firmusformation.com.</p>
        <p className="text-sm">Last updated: May 10, 2026.</p>
      </section>
    </SiteShell>
  );
}
