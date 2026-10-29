import "server-only";
import type postgres from "postgres";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { validPaidPeriod } from "@/lib/billing-policy";
import { db } from "./db";
import { dodo, identifyProduct } from "./dodo";
import { UUID } from "./http";
type Tx = postgres.TransactionSql;
async function owner(sql: Tx, sub: Subscription) {
  const product = identifyProduct(sub.product_id),
    userId = sub.metadata.user_id,
    checkoutId = sub.metadata.checkout_id;
  if (
    !product ||
    sub.metadata.site !== "genie4ai.ai" ||
    typeof userId !== "string" ||
    !UUID.test(userId) ||
    typeof checkoutId !== "string" ||
    !UUID.test(checkoutId)
  )
    return null;
  const [intent] =
    await sql`SELECT * FROM genie4ai.checkout_intents WHERE id=${checkoutId}::uuid AND user_id=${userId}::uuid AND product_id=${sub.product_id}`;
  if (
    !intent ||
    sub.quantity !== 1 ||
    sub.currency !== "USD" ||
    sub.recurring_pre_tax_amount !== product.priceCents ||
    sub.on_demand
  )
    return null;
  return { userId, product, intent };
}
async function persistSubscription(sql: Tx, sub: Subscription, userId: string) {
  await sql`INSERT INTO genie4ai.subscriptions(id,user_id,customer_id,product_id,status,cancel_at_end)
    VALUES(${sub.subscription_id},${userId}::uuid,${sub.customer.customer_id},${sub.product_id},${sub.status},${sub.cancel_at_next_billing_date})
    ON CONFLICT(id) DO UPDATE SET status=excluded.status,cancel_at_end=excluded.cancel_at_end,updated_at=now() WHERE genie4ai.subscriptions.user_id=excluded.user_id`;
}
export async function syncSubscription(id: string) {
  const client = dodo(),
    preview = await client.subscriptions.retrieve(id);
  return db().begin(async (sql) => {
    const identity = await owner(sql, preview);
    if (!identity) return;
    await sql`SELECT id FROM genie4ai.users WHERE id=${identity.userId}::uuid FOR UPDATE`;
    const sub = await client.subscriptions.retrieve(id);
    if (!(await owner(sql, sub))) return;
    await persistSubscription(sql, sub, identity.userId);
  });
}
export async function syncPayment(id: string) {
  const client = dodo(),
    initial = await client.payments.retrieve(id);
  const ids =
    initial.subscription_ids ||
    (initial.subscription_id ? [initial.subscription_id] : []);
  if (ids.length !== 1 || initial.is_multi_subscription) return;
  const preview = await client.subscriptions.retrieve(ids[0]);
  await db().begin(async (sql) => {
    const identity = await owner(sql, preview);
    if (!identity) return;
    await sql`SELECT id FROM genie4ai.users WHERE id=${identity.userId}::uuid FOR UPDATE`;
    const [payment, sub] = await Promise.all([
      client.payments.retrieve(id),
      client.subscriptions.retrieve(ids[0]),
    ]);
    const verified = await owner(sql, sub);
    if (!verified || verified.userId !== identity.userId) return;
    await persistSubscription(sql, sub, identity.userId);
    if (
      payment.status !== "succeeded" ||
      payment.is_update_payment_method ||
      payment.currency !== "USD" ||
      payment.total_amount < identity.product.priceCents ||
      payment.customer.customer_id !== sub.customer.customer_id ||
      (payment.charge_type && !["new", "renewal"].includes(payment.charge_type))
    )
      return;
    if (
      payment.checkout_session_id &&
      payment.charge_type !== "renewal" &&
      payment.checkout_session_id !== identity.intent.session_id
    )
      return;
    const revoked =
      payment.refunds.some((r) => r.status === "succeeded") ||
      payment.disputes.some(
        (d) => !["dispute_won", "dispute_cancelled"].includes(d.dispute_status),
      );
    const period = payment.service_periods.find(
      (p) => p.subscription_id === sub.subscription_id,
    );
    if (
      !period ||
      Number(period.proration_factor) !== 1 ||
      !validPaidPeriod(
        period.starts_at,
        period.ends_at,
        identity.product.interval,
      )
    )
      return;
    await sql`INSERT INTO genie4ai.billing_periods(payment_id,subscription_id,user_id,product_id,plan,interval,period_start,period_end,allowance_cents,revoked)
      VALUES(${id},${sub.subscription_id},${identity.userId}::uuid,${sub.product_id},${identity.product.plan},${identity.product.interval},${new Date(period.starts_at)},${new Date(period.ends_at)},${identity.product.allowanceCents},${revoked})
      ON CONFLICT(payment_id) DO UPDATE SET revoked=genie4ai.billing_periods.revoked OR excluded.revoked`;
  });
}
export async function revokePayment(id: string) {
  // Only known payments belonging to this site may affect entitlements.
  const [period] =
    await db()`SELECT user_id FROM genie4ai.billing_periods WHERE payment_id=${id}`;
  if (!period) return;
  await db().begin(async (sql) => {
    await sql`SELECT id FROM genie4ai.users WHERE id=${period.user_id}::uuid FOR UPDATE`;
    await sql`UPDATE genie4ai.billing_periods SET revoked=true WHERE payment_id=${id}`;
  });
}
