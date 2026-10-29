import { db } from "@/lib/server/db";
import { dodo } from "@/lib/server/dodo";
import {
  revokePayment,
  syncPayment,
  syncSubscription,
} from "@/lib/server/billing";
import { json } from "@/lib/server/http";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY)
    return json({ error: "Billing unavailable." }, 503);
  const id = request.headers.get("webhook-id"),
    timestamp = request.headers.get("webhook-timestamp"),
    signature = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signature)
    return json({ error: "Invalid webhook signature." }, 401);
  if (Number(request.headers.get("content-length")) > 262144)
    return json({ error: "Payload too large." }, 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > 262144)
    return json({ error: "Payload too large." }, 413);
  let event;
  try {
    event = dodo().webhooks.unwrap(text, {
      headers: {
        "webhook-id": id,
        "webhook-timestamp": timestamp,
        "webhook-signature": signature,
      },
    });
  } catch {
    return json({ error: "Invalid webhook signature." }, 401);
  }
  try {
    const [seen] =
      await db()`SELECT id FROM genie4ai.webhook_events WHERE id=${id}`;
    if (seen) return json({ received: true });
    if (event.type === "payment.succeeded")
      await syncPayment(event.data.payment_id);
    else if (
      event.type.startsWith("subscription.") &&
      "subscription_id" in event.data
    )
      await syncSubscription(event.data.subscription_id as string);
    else if (event.type === "refund.succeeded") {
      const refund = await dodo().refunds.retrieve(event.data.refund_id);
      if (refund.status === "succeeded") await revokePayment(refund.payment_id);
    } else if (event.type === "dispute.opened") {
      const dispute = await dodo().disputes.retrieve(event.data.dispute_id);
      if (
        !["dispute_won", "dispute_cancelled"].includes(dispute.dispute_status)
      )
        await revokePayment(dispute.payment_id);
    }
    await db()`INSERT INTO genie4ai.webhook_events(id,event_type) VALUES(${id},${event.type}) ON CONFLICT(id) DO NOTHING`;
    return json({ received: true });
  } catch {
    return json({ error: "Webhook processing will be retried." }, 503);
  }
}
