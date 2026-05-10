import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Firmus Formation Amazon FBA Packages" },
      { name: "description", content: "Transparent packages for Amazon FBA setup, launch and full management. Choose Starter, Growth or A-Z Automation." },
      { property: "og:title", content: "Pricing — Firmus Formation" },
      { property: "og:description", content: "Transparent Amazon FBA agency packages." },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Starter",
    price: "$499",
    tag: "Setup essentials",
    features: ["USA LLC formation", "EIN registration", "Registered agent (1yr)", "Operating agreement", "Mercury bank guidance"],
    cta: "Get Started",
  },
  {
    name: "Growth",
    price: "$1,499",
    tag: "Launch a brand",
    highlight: true,
    features: ["Everything in Starter", "Amazon seller account", "Product research (3 picks)", "Listing optimization", "Trademark filing assistance", "30 days PPC setup"],
    cta: "Most Popular",
  },
  {
    name: "A–Z Automation",
    price: "Custom",
    tag: "Done for you",
    features: ["Everything in Growth", "Sourcing & freight", "Full PPC management", "Bookkeeping & VAT", "Dedicated account manager", "Profit-sharing options"],
    cta: "Talk to Sales",
  },
];

function Pricing() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple, <span className="text-gradient-gold">transparent pricing.</span></>}
        subtitle="Pick the package that matches your stage. Need something custom? Talk to us."
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border p-8 transition-all ${
                t.highlight
                  ? "border-gold/60 bg-gradient-hero shadow-elegant"
                  : "border-border bg-card hover:border-primary/60"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
                  Most Popular
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">{t.tag}</p>
              <h3 className="mt-2 font-display text-3xl font-semibold">{t.name}</h3>
              <div className="mt-4 font-display text-5xl">{t.price}</div>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 shrink-0 text-gold" size={16} /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                  t.highlight
                    ? "bg-gradient-gold text-gold-foreground shadow-gold"
                    : "bg-gradient-primary text-primary-foreground"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          All prices in USD. Government filing fees not included.
        </p>
      </section>
    </SiteShell>
  );
}
