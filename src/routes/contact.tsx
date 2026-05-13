import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, PageHero } from "@/components/SiteShell";
import { useState } from "react";
import { z } from "zod";
import { Mail, MessageCircle, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Firmus Formation — Book a Free Consultation" },
      { name: "description", content: "Book a free 30-minute Amazon FBA strategy call. WhatsApp, email or contact form — we reply within 24 hours." },
      { property: "og:title", content: "Contact Firmus Formation" },
      { property: "og:description", content: "Book your free Amazon FBA consultation today." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().max(80),
  message: z.string().trim().min(10, "Tell us a bit more").max(1000),
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const fieldErrs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrs[i.path[0] as string] = i.message; });
      setErrors(fieldErrs);
      return;
    }
    setErrors({});
    setSent(true);
  };

  return (
    <SiteShell>
      <PageHero
        eyebrow="Contact"
        title={<>Let's build your <span className="text-gradient-gold">Amazon brand.</span></>}
        subtitle="Book a free 30-minute strategy call. We reply within 24 hours, every weekday."
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {[
              { icon: Mail, label: "Email", value: "hello@firmusformation.com", href: "mailto:hello@firmusformation.com" },
              { icon: MessageCircle, label: "WhatsApp", value: "+1 (555) 010-0199", href: "https://wa.me/15550100199" },
              { icon: Phone, label: "Phone", value: "+1 (555) 010-0199", href: "tel:+15550100199" },
              { icon: MapPin, label: "Office", value: "Wilmington, Delaware, USA" },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href?.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
                  <c.icon size={18} />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-gold">{c.label}</span>
                  <span className="block text-sm text-foreground">{c.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="rounded-2xl border border-gold/40 bg-gradient-hero p-10 text-center">
                <CheckCircle2 className="mx-auto text-gold" size={48} />
                <h2 className="mt-4 font-display text-3xl">Message received.</h2>
                <p className="mt-2 text-muted-foreground">A specialist will reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" name="name" error={errors.name} />
                  <Field label="Email" name="email" type="email" error={errors.email} />
                  <Field label="Phone (optional)" name="phone" error={errors.phone} />
                  <div>
                    <label className="mb-2 block text-sm font-medium">Interested in</label>
                    <select
                      name="service"
                      defaultValue="LLC Formation"
                      className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {["LLC Formation","EIN Registration","Amazon Seller Account","Product Research","PPC Management","A–Z Automation","Other"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Message</label>
                  <textarea
                    name="message"
                    rows={5}
                    maxLength={1000}
                    placeholder="Tell us about your goals…"
                    className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition-transform hover:scale-[1.02]"
                >
                  Send Message <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ label, name, type = "text", error }: { label: string; name: string; type?: string; error?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        name={name}
        maxLength={255}
        className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
