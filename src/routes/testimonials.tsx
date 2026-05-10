import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { Star } from "lucide-react";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — What Clients Say | Firmus Formation" },
      { name: "description", content: "Real results from Amazon FBA founders served by Firmus Formation across 40+ countries." },
      { property: "og:title", content: "Client Testimonials — Firmus Formation" },
      { property: "og:description", content: "Founders share their results with Firmus Formation." },
    ],
  }),
  component: Testimonials,
});

const items = [
  { name: "Adeel R.", role: "Founder, Lahore", quote: "From zero to a live Amazon US store in six weeks. Firmus did everything — LLC, EIN, Mercury, listing — and I just shipped." },
  { name: "Maria S.", role: "Seller, Madrid", quote: "Their PPC team cut my ACOS from 48% to 19% in two months. I finally see real profit hitting my account." },
  { name: "Hamza K.", role: "Brand Owner, Dubai", quote: "Mercury approved on the first try. EIN in 5 days. Smooth, professional, no surprises." },
  { name: "Jonas P.", role: "Entrepreneur, Berlin", quote: "I tried two other agencies. Firmus is the only one that delivered on time and explained everything." },
  { name: "Sara A.", role: "Founder, Riyadh", quote: "Their product research is incredible. The product they recommended hit $32k in month 4." },
  { name: "Daniel O.", role: "Brand Owner, Lagos", quote: "Worth every dollar. I now have a real US business and a six-figure Amazon brand." },
];

function Testimonials() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Testimonials"
        title={<>Loved by <span className="text-gradient-gold">founders worldwide.</span></>}
        subtitle="500+ brands launched. $42M+ in client revenue. Here's what they say."
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="rounded-xl border border-border bg-card p-6 shadow-elegant/0 hover:shadow-elegant transition-shadow">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-6 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
