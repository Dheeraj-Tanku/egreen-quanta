import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated") {
    return <Navigate to={location.state?.from ?? "/"} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password, needsTotp ? totp : undefined);
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "mfa_required") {
        setNeedsTotp(true);
        setError("Enter the 6-digit code from your authenticator app.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Check your connection and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path
                d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z"
                stroke="currentColor"
                strokeWidth={1.6}
              />
              <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth={1.6} />
            </svg>
          </div>
          <div>
            <div className="text-base font-semibold text-fg">Egreen Quanta</div>
            <div className="text-[11px] uppercase tracking-widest text-muted">
              SOC console
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {needsTotp && (
            <div>
              <label htmlFor="totp" className="mb-1 block text-xs font-medium text-muted">
                Authenticator code
              </label>
              <input
                id="totp"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {error && (
            <p
              className={
                needsTotp && error.startsWith("Enter")
                  ? "text-xs text-muted"
                  : "text-xs text-critical"
              }
            >
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted">
          Problem Statement 141 · SIH 2026
        </p>
      </div>
    </div>
  );
}
