import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Amazon FBA Insights | Firmus Formation" },
      { name: "description", content: "Guides on USA LLC, EIN, Amazon seller approval, PPC and product research for international FBA sellers." },
      { property: "og:title", content: "Firmus Formation Blog" },
      { property: "og:description", content: "Insights for international Amazon sellers." },
    ],
  }),
  component: Blog,
});

const posts = [
  { slug: "wyoming-vs-delaware-llc", title: "Wyoming vs Delaware LLC for Amazon Sellers", excerpt: "Which state truly wins for non-US Amazon FBA founders in 2025?", date: "May 02, 2026" },
  { slug: "ein-as-non-us-resident", title: "How to Get an EIN as a Non-US Resident in 2026", excerpt: "Step-by-step on Form SS-4, fax vs mail, and avoiding common rejections.", date: "Apr 18, 2026" },
  { slug: "ppc-acos-playbook", title: "The 19% ACOS Playbook We Use Across 200+ Stores", excerpt: "Bid strategy, negative keyword discipline and search-term mining cadence.", date: "Apr 03, 2026" },
  { slug: "amazon-seller-approval", title: "Amazon Seller Account Approval: The 2026 Document Stack", excerpt: "Exactly which utility bills, IDs, and bank statements Amazon accepts now.", date: "Mar 21, 2026" },
];

function Blog() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Blog"
        title={<>Insights for <span className="text-gradient-gold">serious sellers.</span></>}
        subtitle="Practical, no-fluff guides written by operators who run real Amazon brands."
      />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <article key={p.slug} className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-elegant">
              <p className="text-xs uppercase tracking-wider text-gold">{p.date}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">{p.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
              <Link to="/contact" className="mt-4 inline-block text-sm font-semibold text-gold hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
