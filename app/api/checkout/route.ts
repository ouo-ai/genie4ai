import { randomUUID } from "node:crypto";
import { isPlan, isInterval } from "@/lib/plans";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { dodo, productFor } from "@/lib/server/dodo";
import {
  ApiError,
  failure,
  json,
  rateLimit,
  readJson,
  sameOrigin,
} from "@/lib/server/http";
import { requireService } from "@/lib/server/provider";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request),
      body = await readJson(request);
    if (!isPlan(body.plan) || !isInterval(body.interval))
      throw new ApiError("Choose a valid plan and billing interval.");
    await rateLimit(`checkout:${user.id}`, 8, 3600);
    await requireService();
    const productId = productFor(body.plan, body.interval);
    const url = await db().begin(async (sql) => {
      await sql`SELECT id FROM genie4ai.users WHERE id=${user.id}::uuid FOR UPDATE`;
      const [active] =
        await sql`SELECT id FROM genie4ai.subscriptions WHERE user_id=${user.id}::uuid AND status IN ('active','on_hold','paused','past_due') UNION SELECT subscription_id AS id FROM genie4ai.billing_periods WHERE user_id=${user.id}::uuid AND period_end>now() AND revoked=false LIMIT 1`;
      if (active)
        throw new ApiError(
          "Manage or cancel your existing subscription in the billing portal before choosing another plan.",
          409,
        );
      const [pending] =
        await sql`SELECT * FROM genie4ai.checkout_intents WHERE user_id=${user.id}::uuid AND expires_at>now() ORDER BY created_at DESC LIMIT 1`;
      if (pending) {
        if (pending.product_id === productId && pending.checkout_url)
          return pending.checkout_url as string;
        throw new ApiError(
          "You already have an open checkout. Finish it or wait 15 minutes before changing plans.",
          409,
        );
      }
      const id = randomUUID();
      await sql`INSERT INTO genie4ai.checkout_intents(id,user_id,product_id) VALUES(${id}::uuid,${user.id}::uuid,${productId})`;
      const session = await dodo().checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: user.email },
        billing_currency: "USD",
        feature_flags: {
          allow_currency_selection: false,
          allow_discount_code: false,
        },
        return_url: "https://genie4ai.ai/account?checkout=returned",
        cancel_url: "https://genie4ai.ai/#pricing",
        metadata: { site: "genie4ai.ai", user_id: user.id, checkout_id: id },
      });
      if (!session.checkout_url || !session.checkout_url.startsWith("https://"))
        throw new Error("Missing checkout URL");
      await sql`UPDATE genie4ai.checkout_intents SET session_id=${session.session_id},checkout_url=${session.checkout_url} WHERE id=${id}::uuid`;
      return session.checkout_url;
    });
    return json({ url });
  } catch (e) {
    return failure(e);
  }
}
