import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../lib/server/db";
import {
  existingJob,
  finishJob,
  reserveJob,
  accountCredits,
} from "../lib/server/credits";
import { syncPayment } from "../lib/server/billing";
import { productFor } from "../lib/server/dodo";
import { addMonths } from "../lib/plans";
test("verified paid credits: webhook replay, concurrent reservation, ownership and exactly-once refund", async () => {
  const sql = db(),
    userId = randomUUID(),
    outsider = randomUUID(),
    checkoutId = randomUUID(),
    paymentId = `test_${randomUUID()}`,
    subscriptionId = `test_${randomUUID()}`,
    customerId = `test_${randomUUID()}`,
    productId = productFor("creator", "month"),
    start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const end = addMonths(start, 1),
    originalFetch = globalThis.fetch;
  const metadata = {
    site: "genie4ai.ai",
    user_id: userId,
    checkout_id: checkoutId,
  };
  const sub = {
    subscription_id: subscriptionId,
    product_id: productId,
    metadata,
    quantity: 1,
    currency: "USD",
    recurring_pre_tax_amount: 10000,
    on_demand: false,
    status: "active",
    cancel_at_next_billing_date: false,
    customer: { customer_id: customerId },
  };
  let payment = {
    payment_id: paymentId,
    status: "succeeded",
    subscription_ids: [subscriptionId],
    is_multi_subscription: false,
    is_update_payment_method: false,
    currency: "USD",
    total_amount: 10000,
    customer: { customer_id: customerId },
    charge_type: "new",
    checkout_session_id: "test_session",
    refunds: [],
    disputes: [],
    service_periods: [
      {
        subscription_id: subscriptionId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        proration_factor: "1",
      },
    ],
  };
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes(`/subscriptions/${subscriptionId}`))
      return Response.json(sub);
    if (url.includes(`/payments/${paymentId}`)) return Response.json(payment);
    throw Error("Unexpected network request in test");
  };
  try {
    await sql`INSERT INTO genie4ai.users(id,email,password_hash) VALUES(${userId}::uuid,${userId + "@integration.test"},'test'),(${outsider}::uuid,${outsider + "@integration.test"},'test')`;
    await sql`INSERT INTO genie4ai.checkout_intents(id,user_id,product_id,session_id) VALUES(${checkoutId}::uuid,${userId}::uuid,${productId},'test_session')`;
    payment = { ...payment, status: "processing" };
    await syncPayment(paymentId);
    assert.equal(
      await accountCredits(userId),
      null,
      "active subscription without succeeded payment grants no credits",
    );
    payment = { ...payment, status: "succeeded" };
    await Promise.all([syncPayment(paymentId), syncPayment(paymentId)]);
    let window = await accountCredits(userId);
    assert.equal(window?.allowance_cents, 10000);
    assert.equal(window?.used_cents, 0);
    const id = randomUUID(),
      results = await Promise.all([
        reserveJob(id, userId, "same"),
        reserveJob(id, userId, "same"),
      ]);
    assert.equal(results.filter((r) => r.created).length, 1);
    window = await accountCredits(userId);
    assert.equal(window?.used_cents, 500);
    assert.equal(await existingJob(id, outsider), undefined);
    await assert.rejects(reserveJob(id, outsider, "same"), /already in use/);
    await assert.rejects(reserveJob(id, userId, "changed"), /already in use/);
    await Promise.all([
      finishJob(id, { status: "failed" }),
      finishJob(id, { status: "failed" }),
    ]);
    window = await accountCredits(userId);
    assert.equal(window?.used_cents, 0);
    await sql`UPDATE genie4ai.credit_windows SET used_cents=9500 WHERE id=${window!.id}::uuid`;
    const last = await Promise.allSettled([
      reserveJob(randomUUID(), userId, "last1"),
      reserveJob(randomUUID(), userId, "last2"),
    ]);
    assert.equal(last.filter((r) => r.status === "fulfilled").length, 1);
    window = await accountCredits(userId);
    assert.equal(window?.used_cents, 10000);
    await sql`UPDATE genie4ai.billing_periods SET revoked=true WHERE payment_id=${paymentId}`;
    assert.equal(await accountCredits(userId), null);
    await syncPayment(paymentId);
    assert.equal(
      await accountCredits(userId),
      null,
      "replayed payment cannot restore revoked credits",
    );
  } finally {
    globalThis.fetch = originalFetch;
    await sql`DELETE FROM genie4ai.jobs WHERE user_id=${userId}::uuid`;
    await sql`DELETE FROM genie4ai.credit_windows WHERE payment_id=${paymentId}`;
    await sql`DELETE FROM genie4ai.billing_periods WHERE payment_id=${paymentId}`;
    await sql`DELETE FROM genie4ai.subscriptions WHERE id=${subscriptionId}`;
    await sql`DELETE FROM genie4ai.checkout_intents WHERE id=${checkoutId}::uuid`;
    await sql`DELETE FROM genie4ai.users WHERE id IN (${userId}::uuid,${outsider}::uuid)`;
    await sql.end();
  }
});
