import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  UserCog,
  CheckSquare,
  FolderOpen,
  MessagesSquare,
  LifeBuoy,
  Calendar,
  Megaphone,
  Receipt,
  Bot,
  BarChart3,
  Workflow,
  Settings as SettingsIcon,
  FileText,
  MessageSquare,
  Briefcase,
  Tag,
  Inbox,
  LogOut,
  Loader2,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Inbox; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Command",
    items: [{ to: "/admin", label: "CEO Command Center", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Revenue",
    items: [
      { to: "/admin/leads", label: "Leads & CRM", icon: Inbox },
      { to: "/admin/clients", label: "Clients", icon: Users },
      { to: "/admin/orders", label: "Orders", icon: ClipboardList },
      { to: "/admin/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/departments", label: "Departments", icon: Building2 },
      { to: "/admin/employees", label: "Employees", icon: UserCog },
      { to: "/admin/tasks", label: "Tasks & Projects", icon: CheckSquare },
      { to: "/admin/documents", label: "Documents", icon: FolderOpen },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/admin/inbox", label: "Communication", icon: MessagesSquare },
      { to: "/admin/tickets", label: "Support", icon: LifeBuoy },
      { to: "/admin/meetings", label: "Meetings", icon: Calendar },
    ],
  },
  {
    label: "Finance & Intelligence",
    items: [
      { to: "/admin/invoices", label: "Finance Center", icon: Receipt },
      { to: "/admin/ai-accountant", label: "AI Accountant", icon: Bot },
      { to: "/admin/insights", label: "AI Insights", icon: Sparkles },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/automation", label: "AI Automation", icon: Workflow },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/services", label: "Services", icon: Briefcase },
      { to: "/admin/pricing", label: "Pricing", icon: Tag },
      { to: "/admin/blog", label: "Blog", icon: FileText },
      { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [{ to: "/admin/settings", label: "Settings", icon: SettingsIcon }],
  },
];

export function AdminShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/admin/login" });
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-border bg-[color:var(--surface)] transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-elegant">
              <span className="font-display text-base font-bold text-primary-foreground">F</span>
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold leading-tight">Firmus ERP</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Command Center</div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <NavGroupBlock key={g.label} group={g} path={path} />
          ))}
        </nav>

        <div className="border-t border-border p-3">
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

      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg sm:text-2xl">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : (
              <p className="truncate text-xs text-muted-foreground">Signed in as {user.email}</p>
            )}
          </div>
          <NotificationBell />
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}

function NavGroupBlock({ group, path }: { group: NavGroup; path: string }) {
  const hasActive = group.items.some((i) => (i.exact ? path === i.to : path.startsWith(i.to)));
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <span>{group.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {group.items.map((i) => {
            const active = i.exact ? path === i.to : path.startsWith(i.to);
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-elegant"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <i.icon size={16} className="shrink-0" />
                <span className="truncate">{i.label}</span>
                {active && hasActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
