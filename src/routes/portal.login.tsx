import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";
import { lovable } from "@/integrations/lovable";

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
    else if (mode === "signup") {
      setInfo("Account created. Check your email to confirm, then sign in.");
    }
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

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={async () => {
            setError(null);
            const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/portal` });
            if (res.error) setError(res.error instanceof Error ? res.error.message : String(res.error));
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.6 15.1 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.6 6.3 14.1z"/><path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.8 12.9-4.9l-6-5c-2 1.4-4.4 2.4-6.9 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.3 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6 5c-.4.4 6.5-4.7 6.5-14.6 0-1.2-.1-2.4-.4-3.5z"/></svg>
          Continue with Google
        </button>



        <div className="mt-4 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>
              <button onClick={() => setMode("signup")} className="hover:text-foreground">New client? Create an account →</button>
              <button
                type="button"
                onClick={async () => {
                  if (!email) return setError("Enter your email above first, then click forgot password.");
                  const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                  setError(err ? err.message : "Password reset email sent. Check your inbox.");
                }}
                className="hover:text-foreground"
              >
                Forgot password?
              </button>
            </>
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
