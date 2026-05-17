import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, User } from "lucide-react";

export const Route = createFileRoute("/portal/login")({
  head: () => ({ meta: [{ title: "Client Portal Login — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: PortalLogin,
});

function PortalLogin() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/portal" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setBusy(false);
    if (err) setError(err);
    else if (mode === "signup") setError("Account created. Check your email to confirm, then sign in.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-gold">
            <User size={18} className="text-gold-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl">Client Portal</h1>
            <p className="text-xs text-muted-foreground">Track your orders, invoices, and progress</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <button onClick={() => setMode("signup")} className="hover:text-foreground">New client? Create an account →</button>
          ) : (
            <button onClick={() => setMode("signin")} className="hover:text-foreground">← Back to sign in</button>
          )}
        </div>
        <div className="mt-6 text-center text-xs">
          <Link to="/" className="text-muted-foreground hover:text-foreground">← Back to website</Link>
        </div>
      </div>
    </div>
  );
}
