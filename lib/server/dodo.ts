import "server-only";
import DodoPayments from "dodopayments";
import { PLANS, type BillingInterval, type Plan } from "@/lib/plans";
export function dodo() {
  if (
    !process.env.DODO_PAYMENTS_API_KEY ||
    !process.env.DODO_PAYMENTS_WEBHOOK_KEY
  )
    throw new Error("Billing unavailable");
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
    environment: "live_mode",
    timeout: 30000,
    maxRetries: 0,
  });
}
export function productFor(plan: Plan, interval: BillingInterval) {
  const id =
    process.env[
      `DODO_${plan.toUpperCase()}_${interval.toUpperCase()}_PRODUCT_ID`
    ];
  if (!id) throw new Error("Product unavailable");
  return id;
}
export function identifyProduct(id: string) {
  for (const plan of ["creator", "pro"] as const)
    for (const interval of ["month", "year"] as const) {
      if (productFor(plan, interval) === id)
        return {
          plan,
          interval,
          priceCents:
            interval === "year"
              ? PLANS[plan].yearlyCents
              : PLANS[plan].monthlyCents,
          allowanceCents: PLANS[plan].allowanceCents,
        };
    }
  return null;
}
