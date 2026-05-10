import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { allServices } from "./services";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/services_/$slug")({
  loader: ({ params }) => {
    const service = allServices.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.service;
    return {
      meta: [
        { title: s ? `${s.title} — Firmus Formation` : "Service — Firmus Formation" },
        { name: "description", content: s?.desc ?? "" },
        { property: "og:title", content: s?.title ?? "Service" },
        { property: "og:description", content: s?.desc ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl">Service not found</h1>
        <Link to="/services" className="mt-6 inline-block text-gold hover:underline">Back to all services</Link>
      </div>
    </SiteShell>
  ),
  errorComponent: ({ error }) => (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">{error.message}</p>
      </div>
    </SiteShell>
  ),
  component: ServiceDetail,
});

const features = [
  "Dedicated specialist assigned to your account",
  "Compliant documentation and audit trail",
  "Weekly progress updates and reporting",
  "Direct WhatsApp & email support",
];

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const Icon = service.icon;
  return (
    <SiteShell>
      <PageHero
        eyebrow="Service"
        title={<>{service.title}</>}
        subtitle={service.desc}
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Icon size={22} />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold">What's included</h2>
              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="font-display text-2xl font-semibold">How it works</h3>
              <ol className="mt-4 space-y-3 text-muted-foreground">
                <li><span className="text-gold font-semibold">1.</span> Free 30-minute discovery call.</li>
                <li><span className="text-gold font-semibold">2.</span> Custom proposal & timeline within 24 hours.</li>
                <li><span className="text-gold font-semibold">3.</span> Onboarding and document collection.</li>
                <li><span className="text-gold font-semibold">4.</span> Delivery, hand-off and ongoing support.</li>
              </ol>
            </div>
          </div>
          <aside className="rounded-xl border border-border bg-gradient-hero p-8">
            <h3 className="font-display text-xl font-semibold">Get started today</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Book a free consultation. We'll scope your project and send a proposal within 24 hours.
            </p>
            <Link to="/contact" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-gold">
              Book Consultation <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border bg-background/40 px-5 py-3 text-sm font-semibold">
              Explore other services
            </Link>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
