import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Firmus Formation" }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // Supabase recovery link sets a session; wait for it
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // hash-based recovery
        const hash = window.location.hash;
        if (hash.includes("type=recovery")) setReady(true);
        else setErr("This link is invalid or expired. Request a new one.");
      }
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message);
    else {
      setMsg("Password updated. Redirecting…");
      setTimeout(() => navigate({ to: "/portal/login" }), 1500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elegant">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo variant="mark" className="h-10 w-10" />
          <div>
            <h1 className="font-display text-xl">Set a new password</h1>
            <p className="text-xs text-muted-foreground">Choose a strong password you don't use elsewhere.</p>
          </div>
        </div>

        {!ready ? (
          <p className={err ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{err ?? "Verifying link…"}</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">New password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
            <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-gold disabled:opacity-60">
              {busy && <Loader2 size={14} className="animate-spin" />} Update password
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs">
          <Link to="/portal/login" className="text-muted-foreground hover:text-foreground">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
