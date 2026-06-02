// Per-service rich content. Slugs that aren't listed fall back to generic copy.

export type ServiceContent = {
  benefits: string[];
  process: { title: string; desc: string }[];
  timeline: string;
  faqs: { q: string; a: string }[];
  startingPrice?: string;
};

const generic: ServiceContent = {
  benefits: [
    "Dedicated specialist assigned to your account",
    "Compliant documentation and full audit trail",
    "Weekly progress updates and reporting",
    "Direct WhatsApp and email support",
    "Money-back guarantee on missed milestones",
  ],
  process: [
    { title: "Discovery call", desc: "Free 30-minute strategy session to scope your needs." },
    { title: "Proposal & onboarding", desc: "Custom proposal and timeline delivered within 24 hours." },
    { title: "Execution", desc: "Our team handles the work — you stay informed at every step." },
    { title: "Delivery & support", desc: "Final hand-off plus ongoing support and follow-up." },
  ],
  timeline: "Typical turnaround: 2–6 weeks depending on scope.",
  faqs: [
    { q: "Do you work with non-US residents?", a: "Yes — over 80% of our clients are international founders from 40+ countries." },
    { q: "How do payments work?", a: "We accept card, wire transfer, and stablecoin. Most engagements are billed 50% upfront, 50% on delivery." },
    { q: "Is there a guarantee?", a: "Yes. If we miss the agreed milestones, you pay nothing for that phase." },
  ],
};

export const serviceContent: Record<string, ServiceContent> = {
  "llc-formation": {
    startingPrice: "$299",
    benefits: [
      "Wyoming or Delaware LLC filed within 24 hours",
      "Registered agent included for 12 months",
      "EIN-ready operating agreement and EIN application",
      "Compliant for Amazon, Stripe, Mercury and Wise",
      "100% remote — no US visit required",
    ],
    process: [
      { title: "Pick your state", desc: "We recommend Wyoming or Delaware based on your goals." },
      { title: "Name & filing", desc: "We check name availability and file the Articles of Organization." },
      { title: "Documents delivered", desc: "Certificate, EIN application, operating agreement and registered-agent confirmation." },
      { title: "Bank-ready hand-off", desc: "Everything you need to open Mercury, Wise or Payoneer." },
    ],
    timeline: "LLC filed in 24 hours. Full document pack ready within 3–5 business days.",
    faqs: [
      { q: "Wyoming or Delaware — which is better?", a: "For Amazon sellers and SaaS founders, Wyoming wins on privacy and annual cost. Delaware is better for VC-funded startups." },
      { q: "Do I need a US Social Security Number?", a: "No. We file for non-US residents every day. EIN is obtained without an SSN via Form SS-4." },
      { q: "What's the annual cost after year one?", a: "$99/year registered agent + state fees (Wyoming $60, Delaware $300)." },
    ],
  },
  "ein-registration": {
    startingPrice: "$149",
    benefits: [
      "Federal EIN for non-US residents — no SSN required",
      "Direct IRS filing via Form SS-4 by phone/fax",
      "Typically issued in 5–10 business days",
      "Accepted by Amazon, Stripe, Mercury, Wise and Payoneer",
      "Includes official CP-575 confirmation letter",
    ],
    process: [
      { title: "Document collection", desc: "We collect your LLC certificate and responsible-party details." },
      { title: "Form SS-4 prepared", desc: "Filed correctly the first time to avoid IRS rejections." },
      { title: "IRS filing", desc: "Submitted by fax or phone for fastest turnaround." },
      { title: "EIN delivered", desc: "Official IRS confirmation letter sent to you digitally." },
    ],
    timeline: "Most EINs issued in 5–10 business days.",
    faqs: [
      { q: "Can I get an EIN without an SSN or ITIN?", a: "Yes. The IRS issues EINs to foreign responsible parties via Form SS-4." },
      { q: "What if the IRS rejects my application?", a: "We refile at no extra cost until your EIN is issued." },
    ],
  },
  "product-research": {
    startingPrice: "$499",
    benefits: [
      "Data-driven picks using Helium 10 + Jungle Scout + internal scoring",
      "Profit, demand, competition and seasonality validated",
      "3–5 vetted product opportunities per engagement",
      "Full supplier shortlist with target landed cost",
      "Launch projection and break-even analysis",
    ],
    process: [
      { title: "Brief & niche selection", desc: "We align on your budget, risk profile and target marketplaces." },
      { title: "Deep market scan", desc: "Hundreds of products screened against 18-point criteria." },
      { title: "Validation", desc: "Top picks validated with reverse-ASIN, keyword and competitor analysis." },
      { title: "Report delivery", desc: "Full PDF with picks, suppliers, costs and projections." },
    ],
    timeline: "Final research report delivered in 7–10 business days.",
    faqs: [
      { q: "What's your selection criteria?", a: "Minimum $5K/month profit potential, < 1,000 reviews on top 3 listings, healthy 35%+ margin after FBA fees." },
      { q: "Do you guarantee a winning product?", a: "We guarantee research quality. No legitimate agency guarantees market outcomes — anyone who does is lying." },
    ],
  },
  "ppc-management": {
    startingPrice: "$799/mo",
    benefits: [
      "Average ACOS reduced to under 20% within 60 days",
      "Sponsored Products, Brands, Display and DSP coverage",
      "Daily bid adjustments and weekly search-term mining",
      "Dedicated PPC strategist + bi-weekly performance call",
      "Transparent reporting in your client portal",
    ],
    process: [
      { title: "Account audit", desc: "Full review of current campaigns, ACOS, TACoS and waste." },
      { title: "Campaign restructure", desc: "Rebuild with proven exact/phrase/broad architecture." },
      { title: "Daily optimization", desc: "Bid changes, negative keywords, search-term harvesting." },
      { title: "Scale & report", desc: "Bi-weekly reviews, monthly strategy refresh." },
    ],
    timeline: "First optimizations live within 5 days. Meaningful ACOS movement by week 3.",
    faqs: [
      { q: "Minimum ad spend?", a: "We work with brands spending $2K/month or more on Amazon PPC." },
      { q: "Do you manage external traffic too?", a: "Yes — Meta, Google and TikTok ads driving to Amazon listings on request." },
    ],
  },
  "trademark": {
    startingPrice: "$399",
    benefits: [
      "USPTO trademark filing handled end-to-end",
      "Unlocks Amazon Brand Registry 2.0 benefits",
      "Pre-filing knockout search included",
      "Office Action response support",
      "Required for A+ Content, Brand Story and Stores",
    ],
    process: [
      { title: "Knockout search", desc: "We check USPTO and common-law databases for conflicts." },
      { title: "Class selection", desc: "We recommend the right Nice classification for your products." },
      { title: "USPTO filing", desc: "Application filed with your specimen and goods description." },
      { title: "Brand Registry hand-off", desc: "Once filed, we help you enroll in Amazon Brand Registry." },
    ],
    timeline: "USPTO filing in 5 business days. Brand Registry eligible immediately after filing.",
    faqs: [
      { q: "How long until full registration?", a: "USPTO takes 8–14 months. But Amazon Brand Registry accepts pending applications immediately." },
      { q: "What if there's an Office Action?", a: "Standard Office Action responses are included. Substantive refusals are quoted separately." },
    ],
  },
  "bank-account": {
    startingPrice: "$249",
    benefits: [
      "Mercury, Wise Business and Payoneer setups",
      "Pre-screening so you don't get rejected",
      "Multi-currency support for Amazon EU, UK, JP",
      "No US visit or US address required",
      "Includes Amazon disbursement setup",
    ],
    process: [
      { title: "Bank recommendation", desc: "We match you to the right bank based on country and use case." },
      { title: "Application prep", desc: "We prepare every document, statement and form." },
      { title: "Submission & follow-up", desc: "We submit and manage all bank communication." },
      { title: "Live & funded", desc: "Account opened, funded, and connected to Amazon." },
    ],
    timeline: "Most accounts approved in 7–14 business days.",
    faqs: [
      { q: "What if my country is on a restricted list?", a: "We've successfully opened accounts for clients from 40+ countries. We'll tell you upfront if your country is genuinely blocked." },
      { q: "Do you guarantee approval?", a: "We guarantee a refund minus a small processing fee if the bank rejects you despite our pre-screening." },
    ],
  },
  "amazon-seller-account": {
    startingPrice: "$599",
    benefits: [
      "Professional seller account approved on the first try",
      "Full document stack: utility bill, ID, bank statement, LLC docs",
      "Marketplace-specific compliance (US, UK, EU, JP)",
      "Video verification coaching included",
      "Reinstatement support if anything goes wrong",
    ],
    process: [
      { title: "Eligibility review", desc: "We confirm your country, documents and LLC are ready." },
      { title: "Document preparation", desc: "Every document formatted exactly to Amazon's 2026 requirements." },
      { title: "Account creation & verification", desc: "We guide you through identity verification and video calls." },
      { title: "Marketplace activation", desc: "Account live, payment method set, ready to list." },
    ],
    timeline: "Account approved in 2–4 weeks including video verification.",
    faqs: [
      { q: "What's your approval rate?", a: "97% first-attempt approval across 500+ accounts in 2025." },
      { q: "What if my account is suspended later?", a: "We offer reinstatement appeals separately — most clients never need them." },
    ],
  },
  "amazon-az": {
    startingPrice: "$1,499/mo",
    benefits: [
      "Done-for-you Amazon brand — product, listings, ads, support",
      "Profit-share model available alongside flat retainer",
      "Inventory planning to avoid stockouts and storage fees",
      "Account health monitoring 7 days a week",
      "Dedicated brand manager + ops team",
    ],
    process: [
      { title: "Onboarding", desc: "We audit your store, brand, products and finances." },
      { title: "90-day plan", desc: "Clear roadmap covering listings, ads, sourcing and growth." },
      { title: "Execution", desc: "Our team runs day-to-day operations across all functions." },
      { title: "Scale", desc: "New SKUs, international expansion, off-Amazon traffic." },
    ],
    timeline: "Onboarding takes 2 weeks. Most clients see double-digit growth within 90 days.",
    faqs: [
      { q: "Who owns the account?", a: "You do — always. We operate as your team, never as the account holder." },
      { q: "Is there a contract?", a: "Month-to-month with a 30-day notice period. No long lock-ins." },
    ],
  },
};

export function getServiceContent(slug: string): ServiceContent {
  return serviceContent[slug] ?? generic;
}
