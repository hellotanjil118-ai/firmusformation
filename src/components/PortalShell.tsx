import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { LayoutDashboard, FileText, Receipt, LogOut, Loader2, ExternalLink, LifeBuoy, User, Plus } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

const items: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/portal/orders", label: "My Orders", icon: FileText },
  { to: "/portal/orders/new", label: "Order a Service", icon: Plus },
  { to: "/portal/invoices", label: "Invoices", icon: Receipt },
  { to: "/portal/tickets", label: "Support", icon: LifeBuoy },
  { to: "/portal/profile", label: "Profile", icon: User },
];

export function PortalShell({ children, title }: { children: ReactNode; title: string }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/portal/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-64 shrink-0 border-r border-border bg-[color:var(--surface)] md:block">
        <div className="border-b border-border p-5">
          <Link to="/portal" className="flex items-center gap-2">
            <BrandLogo variant="mark" className="h-8 w-8" />
            <span className="font-display text-sm font-semibold">Client Portal</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((i) => {
            const active = i.exact ? path === i.to : path.startsWith(i.to);
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <i.icon size={16} />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-3">
          <a href="/" target="_blank" rel="noreferrer" className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
            <ExternalLink size={14} /> View website
          </a>
          <button onClick={() => signOut().then(() => navigate({ to: "/portal/login" }))} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="font-display text-2xl">{title}</h1>
            <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
          </div>
          <NotificationBell />
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
