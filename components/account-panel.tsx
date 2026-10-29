"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, useAccount } from "./site-provider";
import { isPlan, isInterval, PLANS } from "@/lib/plans";
export function AccountPanel() {
  const { account, loading, refresh } = useAccount(),
    query = useSearchParams();
  const [action, setAction] = useState<"login" | "register">("register"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    if (query.get("checkout")) {
      const timer = setInterval(() => {
        void refresh();
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [query, refresh]);
  async function authenticate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth", { action, email, password });
      setPassword("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function billing(kind: "checkout" | "cancel") {
    setBusy(true);
    setError("");
    try {
      if (kind === "cancel") {
        await api("/api/billing/cancel", {});
        setConfirmCancel(false);
        await refresh();
      } else {
        const data = await api("/api/checkout", {
          plan: query.get("plan"),
          interval: query.get("interval"),
        });
        window.location.assign(data.url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const plan = query.get("plan"),
    interval = query.get("interval"),
    selection = isPlan(plan) && isInterval(interval);
  if (loading) return <p role="status">Loading your account…</p>;
  return (
    <>
      {!account?.user ? (
        <div className="auth-layout">
          <div>
            <p className="eyebrow">YOUR WORLDS START HERE</p>
            <h1>
              {action === "register"
                ? "Make room for\nyour imagination."
                : "Welcome back."}
            </h1>
            <p className="muted">
              One account for your worlds, credits and subscription.
            </p>
            <p className="fine">
              Generation uses World Labs Marble 1.1.
              <br />
              No free generation credits are included.
            </p>
          </div>
          <form className="form-panel" onSubmit={authenticate}>
            <div className="billing-switch">
              <button
                type="button"
                aria-pressed={action === "register"}
                onClick={() => {
                  setAction("register");
                  setError("");
                }}
              >
                Create account
              </button>
              <button
                type="button"
                aria-pressed={action === "login"}
                onClick={() => {
                  setAction("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </div>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  action === "register" ? "new-password" : "current-password"
                }
                required
                minLength={12}
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <p className="fine">
              Use at least 12 characters. Keep your password safe; email
              password recovery is not available yet.
            </p>
            <button className="action" disabled={busy}>
              {busy
                ? "Please wait…"
                : action === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>
            <p className="fine">
              By continuing, you agree to the <Link href="/terms">Terms</Link>{" "}
              and <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR CREATIVE SPACE</p>
              <h1>Account & billing</h1>
              <p className="muted">{account.user.email}</p>
            </div>
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/api/auth", { action: "logout" });
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sign out ↗
            </button>
          </div>
          {query.get("checkout") && (
            <p className="notice">
              Payment confirmation can take a few minutes. Credits appear after
              the verified payment callback. Returning from checkout alone does
              not activate a plan.
            </p>
          )}
          <div className="account-grid" id="billing">
            <div className="form-panel">
              <p className="eyebrow">AVAILABLE CREDITS</p>
              <p className="balance">
                ${((account.balanceCents || 0) / 100).toFixed(2)}
              </p>
              <p>
                {account.generationsRemaining || 0} generations remaining · $5
                credits each
              </p>
              {account.creditResetAt && (
                <p className="fine">
                  Current allocation expires{" "}
                  {new Date(account.creditResetAt).toLocaleString()}. Unused
                  credits do not roll over.
                </p>
              )}
              <Link className="action" href="/studio">
                Open studio ↗
              </Link>
            </div>
            <div className="form-panel">
              <p className="eyebrow">SUBSCRIPTION</p>
              <h2>
                {account.plan ? PLANS[account.plan].name : "No paid plan"}
              </h2>
              <p>
                {account.interval === "year"
                  ? "Annual billing · monthly credit allocation"
                  : account.interval === "month"
                    ? "Monthly billing"
                    : "Choose a plan to start creating."}
              </p>
              {account.renewsAt && (
                <p className="fine">
                  {account.cancelAtEnd
                    ? "Access ends"
                    : "Current paid period ends"}{" "}
                  {new Date(account.renewsAt).toLocaleDateString()}.{" "}
                  {account.cancelAtEnd
                    ? "Renewal is cancelled."
                    : "Renews automatically unless cancelled."}
                </p>
              )}
              {account.subscriptionStatus && !account.cancelAtEnd ? (
                <>
                  {confirmCancel ? (
                    <div className="notice">
                      <p>
                        Cancel renewal? You keep the remainder of your paid
                        period.
                      </p>
                      <button
                        className="action secondary"
                        disabled={busy}
                        onClick={() => billing("cancel")}
                      >
                        {busy ? "Cancelling…" : "Confirm cancellation"}
                      </button>
                      <button
                        className="text-link"
                        onClick={() => setConfirmCancel(false)}
                      >
                        Keep subscription
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-link"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel renewal
                    </button>
                  )}
                </>
              ) : (
                <Link className="text-link" href="/#pricing">
                  View plans ↗
                </Link>
              )}
            </div>
          </div>
          {selection && !account.plan && (
            <div className="notice">
              <h2>Continue with {PLANS[plan].name}</h2>
              <p>
                {interval === "year"
                  ? `$${PLANS[plan].yearlyCents / 100} per year`
                  : `$${PLANS[plan].monthlyCents / 100} per month`}{" "}
                · {PLANS[plan].generations} generations allocated monthly.
              </p>
              <button
                className="action"
                disabled={busy || !account.serviceAvailable}
                onClick={() => billing("checkout")}
              >
                {busy ? "Opening checkout…" : "Continue to secure checkout ↗"}
              </button>
              {!account.serviceAvailable && (
                <p className="fine">
                  New purchases are paused while generation is unavailable.
                </p>
              )}
            </div>
          )}
          <p className="fine">
            Need help with a failed job, billing or your account?{" "}
            <Link href="/contact">Contact support</Link>. Include your job or
            payment ID.
          </p>
        </>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
