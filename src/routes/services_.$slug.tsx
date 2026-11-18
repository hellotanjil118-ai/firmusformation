import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { allServices } from "./services";
import { getServiceContent } from "@/lib/serviceContent";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/services_/$slug")({
  loader: ({ params }) => {
    const service = allServices.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData, params }) => {
    const s = loaderData?.service;
    const title = s ? `${s.title} — Firmus Formation` : "Service — Firmus Formation";
    const desc = s?.desc ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: `https://firmus-launchpad.lovable.app/services/${params.slug}` },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [
        { rel: "canonical", href: `https://firmus-launchpad.lovable.app/services/${params.slug}` },
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

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const content = getServiceContent(service.slug);
  const Icon = service.icon;

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Service</p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
                <Icon size={26} />
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">
                {service.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground">{service.desc}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#lead-form" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]">
                  Get started <ArrowRight size={16} />
                </a>
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary">
                  Book a free call
                </Link>
              </div>
            </div>
            {content.startingPrice && (
              <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-elegant">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Starting at</p>
                <p className="mt-1 font-display text-3xl text-gradient-gold">{content.startingPrice}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Benefits</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-4xl">Why founders choose us for this.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {content.benefits.map((b) => (
            <div key={b} className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
              <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={20} />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="bg-[color:var(--surface)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Process</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold md:text-4xl">A clear, step-by-step path.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {content.process.map((step, i) => (
              <div key={step.title} className="relative rounded-xl border border-border bg-background p-6">
                <span className="font-display text-5xl text-gradient-gold opacity-80">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-sm">
            <Clock size={16} className="text-gold" />
            <span className="text-muted-foreground">{content.timeline}</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">FAQ</p>
        <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Common questions.</h2>
        <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
          {content.faqs.map((f) => (
            <details key={f.q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-display text-lg font-semibold">{f.q}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Lead form + CTA */}
      <section id="lead-form" className="bg-[color:var(--surface)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Get started</p>
            <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Ready to move forward with <span className="text-gradient-gold">{service.title}?</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tell us a bit about your situation — we'll send a custom proposal and timeline within 24 hours.
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <a href="https://wa.me/15550100199" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-gold hover:underline">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
              <div className="text-muted-foreground">Or email hello@firmusformation.com</div>
            </div>
          </div>
          <LeadForm service={service.title} />
        </div>
      </section>
    </SiteShell>
  );
}

function LeadForm({ service }: { service: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email and a short message.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.from("leads").insert({
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 255),
      phone: phone.trim().slice(0, 50) || null,
      service: service.slice(0, 100),
      message: message.trim().slice(0, 2000),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setName(""); setEmail(""); setPhone(""); setMessage("");
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-background p-8 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={36} />
        <h3 className="mt-4 font-display text-2xl font-semibold">Thanks — we got it.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          A specialist will reach out within 24 hours with your custom proposal.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-8 shadow-elegant">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>
      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Phone / WhatsApp (optional)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={50} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <label className="mt-4 block text-sm">
        <span className="mb-1 block font-medium">Tell us about your project</span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={4} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </label>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Request proposal <ArrowRight size={16} /></>}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        We reply within 24 hours, Mon–Fri. No spam, ever.
      </p>
    </form>
  );
}
