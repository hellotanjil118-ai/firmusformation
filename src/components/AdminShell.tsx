import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  MessageSquare,
  Briefcase,
  Tag,
  Users,
  LogOut,
  Loader2,
  ExternalLink,
  ClipboardList,
  LifeBuoy,
} from "lucide-react";

const items: { to: string; label: string; icon: typeof Inbox; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/tickets", label: "Support", icon: LifeBuoy },
  { to: "/admin/blog", label: "Blog", icon: FileText },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
  { to: "/admin/services", label: "Services", icon: Briefcase },
  { to: "/admin/pricing", label: "Pricing", icon: Tag },
];

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
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
          <Link to="/admin" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">F</span>
            </div>
            <span className="font-display text-sm font-semibold">Firmus ERP</span>
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
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <i.icon size={16} />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-border p-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
          >
            <ExternalLink size={14} /> View website
          </a>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/admin/login" }))}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
          <h1 className="font-display text-2xl">{title}</h1>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
          )}
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
