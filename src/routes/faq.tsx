import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Amazon FBA Setup Questions Answered | Firmus Formation" },
      { name: "description", content: "Answers to the most common questions about USA LLC formation, EIN, Amazon seller account approval and FBA management." },
      { property: "og:title", content: "FAQ — Firmus Formation" },
      { property: "og:description", content: "Common Amazon FBA agency questions answered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FAQ,
});

const faqs = [
  { q: "Do I need to be in the US to form an LLC?", a: "No. We help non-US founders form a Wyoming or Delaware LLC fully remotely. You never need to visit the US." },
  { q: "How long does the entire setup take?", a: "Typical timeline: LLC in 24-48h, EIN in 5-15 days, bank account in 1-3 weeks, Amazon seller approval in 2-4 weeks." },
  { q: "Will Amazon really approve my seller account?", a: "Our approval rate is 98% because we prepare every document Amazon requires before submission. Re-application is free if needed." },
  { q: "How is your PPC pricing structured?", a: "Flat monthly fee based on ad spend tier — no percentage of revenue, no surprise invoices." },
  { q: "What countries do you serve?", a: "We've worked with founders from 40+ countries including Pakistan, India, UAE, KSA, Egypt, Nigeria, UK, Germany, Spain and more." },
  { q: "Do you offer money-back guarantees?", a: "Yes — milestone-based refunds. If we don't deliver an agreed milestone, you don't pay for it." },
  { q: "Can you take over an existing Amazon brand?", a: "Absolutely. Our A–Z Automation package is built exactly for that. We audit, optimize and operate." },
  { q: "What is the average ACOS after PPC optimization?", a: "Across our portfolio, the average ACOS after 60 days is 19%." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SiteShell>
      <PageHero
        eyebrow="FAQ"
        title={<>Questions, <span className="text-gradient-gold">answered.</span></>}
        subtitle="Everything you might want to know before working with Firmus Formation."
      />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display text-lg font-semibold">{f.q}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-gold transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-6 py-5 text-muted-foreground">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
