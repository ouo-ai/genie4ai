"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { PLANS, type Plan, type BillingInterval } from "@/lib/plans";
import { api, useAccount } from "./site-provider";
export function Pricing() {
  const [interval, setInterval] = useState<BillingInterval>("month"),
    [busy, setBusy] = useState<Plan | null>(null),
    [error, setError] = useState("");
  const { account, loading } = useAccount(),
    router = useRouter();
  async function choose(plan: Plan) {
    if (!account?.user) {
      router.push(`/account?plan=${plan}&interval=${interval}`);
      return;
    }
    setBusy(plan);
    setError("");
    try {
      const data = await api("/api/checkout", { plan, interval });
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout is unavailable.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="section shell" id="pricing">
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 / A PLAN FOR YOUR IMAGINATION</p>
          <h2>
            More worlds.
            <br />
            <span className="muted">Clear pricing.</span>
          </h2>
        </div>
        <div className="billing-switch" aria-label="Billing interval">
          <button
            aria-pressed={interval === "month"}
            onClick={() => setInterval("month")}
          >
            Monthly
          </button>
          <button
            aria-pressed={interval === "year"}
            onClick={() => setInterval("year")}
          >
            Annual <span>−20%</span>
          </button>
        </div>
      </div>
      {account && !account.serviceAvailable && (
        <p className="notice" role="status">
          Generation is temporarily unavailable. New purchases are paused until
          service is ready.
        </p>
      )}
      <div className="pricing-grid">
        {(["creator", "pro"] as const).map((plan, index) => (
          <article
            className={`price-plan ${index ? "featured" : ""}`}
            key={plan}
          >
            <div className="plan-top">
              <span className="eyebrow">
                {index ? "FOR BIGGER IDEAS" : "FOR EVERY EXPLORER"}
              </span>
              <span>0{index + 1}</span>
            </div>
            <h3>{PLANS[plan].name}</h3>
            <p>
              {index
                ? "Build a broader collection of places."
                : "Make room for your next imagined place."}
            </p>
            <div className="price">
              $
              {interval === "year"
                ? PLANS[plan].yearlyCents / 1200
                : PLANS[plan].monthlyCents / 100}
              <small>/ month</small>
            </div>
            <p className="billing-note">
              {interval === "year"
                ? `$${(PLANS[plan].yearlyCents / 100).toLocaleString("en-US")} billed annually · save 20%`
                : `$${PLANS[plan].monthlyCents / 100} billed monthly`}
            </p>
            <ul>
              {[
                `${PLANS[plan].generations} generations each month`,
                `$${PLANS[plan].allowanceCents / 100} monthly generation credits`,
                "$5 credits used per generation",
                "Image or text to 3D world",
                "Browser preview & available asset downloads",
                "Confirmed failures restore credits",
              ].map((text) => (
                <li key={text}>
                  <Check size={15} />
                  {text}
                </li>
              ))}
            </ul>
            <button
              className={index ? "action" : "action secondary"}
              disabled={
                !!busy || loading || (!!account && !account.serviceAvailable)
              }
              onClick={() => choose(plan)}
            >
              {busy === plan
                ? "Opening checkout…"
                : `Choose ${PLANS[plan].name}`}
              <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      <p className="fine pricing-terms">
        Monthly credits expire at each allocation reset, including on annual
        plans. No rollover. Subscriptions renew automatically until cancelled.
        Prices in USD; applicable taxes are calculated at checkout.{" "}
        <a href="/refunds">Refund policy</a>.
      </p>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </section>
  );
}
