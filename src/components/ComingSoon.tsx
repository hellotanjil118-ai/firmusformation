import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function ComingSoon({
  title,
  description,
  features,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  features?: string[];
  icon?: typeof Sparkles;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-[color:var(--surface)] p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Icon size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> In development
            </div>
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {features && features.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <FeatureCard key={f}>{f}</FeatureCard>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
      <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-primary" />
      {children}
    </div>
  );
}
