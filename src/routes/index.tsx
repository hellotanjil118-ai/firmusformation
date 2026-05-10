import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import heroImg from "@/assets/hero.jpg";
import {
  Building2, FileBadge, IdCard, ShoppingBag, Search, Boxes,
  Megaphone, ListChecks, Shield, MapPin, Landmark, Calculator,
  Receipt, Bot, ArrowRight, Sparkles, Globe2, Clock, Users,
  CheckCircle2, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Firmus Formation — Premium Amazon FBA Agency for Global Sellers" },
      { name: "description", content: "Launch and scale on Amazon with confidence. USA LLC, EIN, seller account, product research, PPC and full A-Z management — done by experts." },
      { property: "og:title", content: "Firmus Formation — Amazon FBA Agency" },
      { property: "og:description", content: "Premium Amazon FBA setup and management for international sellers." },
    ],
  }),
  component: Home,
});

const services = [
  { icon: Building2, title: "USA LLC Formation", desc: "Form your Wyoming/Delaware LLC fully remote — fast filing, registered agent included." },
  { icon: FileBadge, title: "EIN Registration", desc: "Federal EIN for non-US founders. Required for Amazon, banking and Stripe." },
  { icon: IdCard, title: "ITIN Assistance", desc: "Certified Acceptance Agent–assisted ITIN to unlock US tax compliance." },
  { icon: ShoppingBag, title: "Amazon Seller Account", desc: "Professional seller account approval with full document preparation." },
  { icon: Search, title: "Product Research", desc: "Data-driven winning product picks with profit, demand and competition scoring." },
  { icon: Boxes, title: "Product Sourcing", desc: "Vetted suppliers, sample handling, QC and freight to Amazon FCs." },
  { icon: Megaphone, title: "PPC Management", desc: "Aggressive ACOS reduction with sponsored ads, DSP and search-term mining." },
  { icon: ListChecks, title: "Listing Optimization", desc: "Conversion-focused copy, keyword stack and premium A+ content." },
  { icon: Shield, title: "Trademark Assistance", desc: "USPTO trademark filing for Brand Registry and IP protection." },
  { icon: MapPin, title: "Virtual US Address", desc: "Premium business address with mail scanning and forwarding." },
  { icon: Landmark, title: "Bank Account Setup", desc: "Mercury, Wise, Payoneer — opened the right way for non-US founders." },
  { icon: Calculator, title: "Bookkeeping", desc: "Monthly books reconciled to your seller account and bank statements." },
  { icon: Receipt, title: "VAT / Tax Support", desc: "Sales tax, VAT registrations and annual federal/state filings." },
  { icon: Bot, title: "Amazon A–Z Automation", desc: "Done-for-you store: we run inventory, ads, support — you collect profit." },
];

const why = [
  { icon: Users, title: "Expert Team", desc: "10+ years across Amazon US, UK & EU marketplaces." },
  { icon: Clock, title: "Fast Processing", desc: "LLC in 24h, EIN in days, seller account in weeks." },
  { icon: Globe2, title: "International Support", desc: "We work with founders from 40+ countries." },
  { icon: Shield, title: "Trusted & Compliant", desc: "Fully documented process, no shortcuts, no risk." },
  { icon: Sparkles, title: "End-to-End Solutions", desc: "From idea to first sale to seven figures." },
  { icon: CheckCircle2, title: "Money-back Guarantee", desc: "If we don't deliver milestones, you don't pay." },
];

const steps = [
  { n: "01", title: "Consultation", desc: "Free 30-min strategy call to map your launch." },
  { n: "02", title: "Setup", desc: "LLC, EIN, bank, seller account — all handled." },
  { n: "03", title: "Documentation", desc: "Compliance, trademark, listings — done right." },
  { n: "04", title: "Launch", desc: "Inventory in FCs, ads live, growth engine on." },
];

const testimonials = [
  { name: "Adeel R.", role: "Founder, Lahore", quote: "Firmus took me from zero to a live Amazon US store in six weeks. Best decision I made this year." },
  { name: "Maria S.", role: "Seller, Madrid", quote: "Their PPC team cut my ACOS from 48% to 19%. Profitability changed overnight." },
  { name: "Hamza K.", role: "Brand Owner, Dubai", quote: "Clean LLC, smooth EIN, Mercury approved on the first try. Truly end-to-end." },
];

function Home() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Amazon FBA global commerce illustration"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-40">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
            <Sparkles size={14} /> Amazon FBA Agency
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
            Launch a profitable <span className="text-gradient-gold">Amazon brand</span> from anywhere in the world.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Firmus Formation handles your USA LLC, EIN, banking, product research, PPC and full A–Z management — so you focus on growth, not paperwork.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]">
              Book Consultation <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]">
              Get Started
            </Link>
            <a href="https://wa.me/15550100199" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary">
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
          <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-8 text-sm">
            {[
              { k: "500+", v: "Brands launched" },
              { k: "$42M+", v: "Client revenue" },
              { k: "40+", v: "Countries served" },
            ].map((s) => (
              <div key={s.v}>
                <div className="font-display text-3xl text-gradient-gold">{s.k}</div>
                <div className="mt-1 text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">What we do</p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Everything your Amazon brand needs.</h2>
          </div>
          <Link to="/services" className="text-sm font-semibold text-gold hover:underline">View all services →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 9).map((s) => (
            <div key={s.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-elegant">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <s.icon size={20} />
              </div>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-[color:var(--surface)]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Why Firmus</p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Built for serious sellers.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {why.map((w) => (
              <div key={w.title} className="rounded-xl border border-border bg-background p-6">
                <w.icon className="text-gold" size={22} />
                <h3 className="mt-4 font-display text-xl font-semibold">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Our Process</p>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Four steps to a live Amazon brand.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
              <span className="font-display text-6xl text-gradient-gold opacity-80">{s.n}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[color:var(--surface)]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Client stories</p>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Trusted by founders worldwide.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-xl border border-border bg-background p-6">
                <blockquote className="text-foreground">"{t.quote}"</blockquote>
                <figcaption className="mt-6 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-hero p-10 md:p-16">
          <h2 className="max-w-3xl font-display text-4xl font-semibold md:text-5xl">
            Ready to build your <span className="text-gradient-gold">7-figure Amazon brand?</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Book a free strategy call and get a custom roadmap within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold">
              Book Consultation <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="inline-flex items-center rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold hover:bg-secondary">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
