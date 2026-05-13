import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Firmus Formation Amazon FBA Packages" },
      { name: "description", content: "Transparent packages for Amazon FBA setup, launch and full management." },
      { property: "og:title", content: "Pricing — Firmus Formation" },
      { property: "og:description", content: "Transparent Amazon FBA agency packages." },
    ],
  }),
  component: Pricing,
});

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string | null;
  description: string | null;
  features: string[];
  cta_label: string;
  highlighted: boolean;
  order_index: number;
};

function Pricing() {
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    supabase
      .from("pricing_plans")
      .select("*")
      .order("order_index")
      .then(({ data }) => setPlans((data as unknown as Plan[]) ?? []));
  }, []);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple, <span className="text-gradient-gold">transparent pricing.</span></>}
        subtitle="Pick the package that matches your stage. Need something custom? Talk to us."
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        {plans === null ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No pricing plans yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((t) => (
              <div
                key={t.id}
                className={`relative rounded-2xl border p-8 transition-all ${
                  t.highlighted
                    ? "border-gold/60 bg-gradient-hero shadow-elegant"
                    : "border-border bg-card hover:border-primary/60"
                }`}
              >
                {t.highlighted && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
                    Most Popular
                  </span>
                )}
                {t.description && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">{t.description}</p>
                )}
                <h3 className="mt-2 font-display text-3xl font-semibold">{t.name}</h3>
                <div className="mt-4 font-display text-5xl">
                  {t.price}
                  {t.period && <span className="ml-1 text-base text-muted-foreground">/{t.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {(t.features ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="mt-0.5 shrink-0 text-gold" size={16} /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    t.highlighted
                      ? "bg-gradient-gold text-gold-foreground shadow-gold"
                      : "bg-gradient-primary text-primary-foreground"
                  }`}
                >
                  {t.cta_label}
                </Link>
              </div>
            ))}
          </div>
        )}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          All prices in USD. Government filing fees not included.
        </p>
      </section>
    </SiteShell>
  );
}
