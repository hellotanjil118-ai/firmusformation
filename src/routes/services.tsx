import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import {
  Building2, FileBadge, IdCard, ShoppingBag, Search, Boxes,
  Megaphone, ListChecks, Shield, MapPin, Landmark, Calculator,
  Receipt, Bot, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Amazon FBA Services — LLC, EIN, PPC & A-Z | Firmus Formation" },
      { name: "description", content: "Full-service Amazon FBA agency: USA LLC, EIN, ITIN, seller account, product research, sourcing, PPC, listings, trademark and automation." },
      { property: "og:title", content: "Amazon FBA Services — Firmus Formation" },
      { property: "og:description", content: "Every service you need to launch and grow on Amazon." },
    ],
  }),
  component: ServicesPage,
});

export const allServices = [
  { slug: "llc-formation", icon: Building2, title: "USA LLC Formation", desc: "Wyoming/Delaware LLC, fully remote, registered agent included." },
  { slug: "ein-registration", icon: FileBadge, title: "EIN Registration", desc: "Federal EIN for non-US founders — fast, compliant, accepted everywhere." },
  { slug: "itin", icon: IdCard, title: "ITIN Assistance", desc: "Certified Acceptance Agent–assisted ITIN for tax compliance." },
  { slug: "amazon-seller-account", icon: ShoppingBag, title: "Amazon Seller Account", desc: "Professional seller account approval with full document prep." },
  { slug: "product-research", icon: Search, title: "Product Research", desc: "Profit-validated winning product picks with competitor scoring." },
  { slug: "product-sourcing", icon: Boxes, title: "Product Sourcing", desc: "Vetted suppliers, sample handling, QC and freight to FCs." },
  { slug: "ppc-management", icon: Megaphone, title: "PPC Management", desc: "Aggressive ACOS reduction with sponsored ads, DSP and search-term mining." },
  { slug: "listing-optimization", icon: ListChecks, title: "Listing Optimization", desc: "Conversion-focused copy, keyword stack and premium A+ content." },
  { slug: "trademark", icon: Shield, title: "Trademark Assistance", desc: "USPTO trademark filing for Brand Registry and IP protection." },
  { slug: "virtual-address", icon: MapPin, title: "Virtual US Address", desc: "Premium business address with mail scanning and forwarding." },
  { slug: "bank-account", icon: Landmark, title: "Bank Account Setup", desc: "Mercury, Wise, Payoneer — opened the right way for non-US founders." },
  { slug: "bookkeeping", icon: Calculator, title: "Bookkeeping", desc: "Monthly books reconciled to seller account and bank statements." },
  { slug: "tax-vat", icon: Receipt, title: "VAT / Tax Support", desc: "Sales tax, VAT registrations and annual federal/state filings." },
  { slug: "amazon-az", icon: Bot, title: "Amazon A–Z Automation", desc: "Done-for-you store: inventory, ads, support — you collect profit." },
];

function ServicesPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Services"
        title={<>Everything your Amazon brand <span className="text-gradient-gold">will ever need.</span></>}
        subtitle="From day-one paperwork to scaling past seven figures — pick a single service or let us run the entire operation."
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allServices.map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-elegant"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <s.icon size={20} />
              </div>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold">
                Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
