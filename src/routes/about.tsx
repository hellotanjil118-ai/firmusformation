import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Firmus Formation — Amazon FBA Experts" },
      { name: "description", content: "Meet the team behind Firmus Formation. We help international entrepreneurs launch and scale on Amazon US, UK and EU." },
      { property: "og:title", content: "About Firmus Formation" },
      { property: "og:description", content: "International Amazon FBA setup and growth specialists." },
    ],
  }),
  component: About,
});

const values = [
  "Transparent pricing — no hidden fees, ever.",
  "Compliant by default — proper paperwork, no shortcuts.",
  "Outcome-focused — we measure success in your revenue.",
  "Senior operators only — no junior account managers.",
];

function About() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="About Us"
        title={<>We turn ambitious sellers into <span className="text-gradient-gold">global brands.</span></>}
        subtitle="Firmus Formation was founded by Amazon operators and US tax specialists tired of seeing international founders waste years figuring out paperwork. We do it for you in days."
      />
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">Our mission</h2>
            <p className="mt-4 text-muted-foreground">
              To make launching a US-based Amazon brand as simple as opening a software account. From LLC formation to your first profitable PPC campaign — one team, one accountable partner.
            </p>
            <h2 className="mt-10 font-display text-3xl font-semibold md:text-4xl">Why founders choose us</h2>
            <ul className="mt-4 space-y-3">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={18} /> <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="grid grid-cols-2 gap-6">
              {[
                { k: "500+", v: "Brands launched" },
                { k: "$42M+", v: "Client revenue managed" },
                { k: "40+", v: "Countries served" },
                { k: "19%", v: "Average ACOS" },
                { k: "10+", v: "Years experience" },
                { k: "98%", v: "Approval rate" },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border bg-background p-5">
                  <div className="font-display text-3xl text-gradient-gold">{s.k}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
            <Link to="/contact" className="mt-8 inline-flex items-center justify-center rounded-md bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-gold">
              Talk to our team
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
