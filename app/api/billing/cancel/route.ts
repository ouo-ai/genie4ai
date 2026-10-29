import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { dodo } from "@/lib/server/dodo";
import { syncSubscription } from "@/lib/server/billing";
import {
  ApiError,
  failure,
  json,
  rateLimit,
  sameOrigin,
} from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request);
    await rateLimit(`cancel:${user.id}`, 10, 3600);
    const [sub] =
      await db()`SELECT id FROM genie4ai.subscriptions WHERE user_id=${user.id}::uuid AND status IN ('active','on_hold','past_due','paused') ORDER BY updated_at DESC LIMIT 1`;
    if (!sub) throw new ApiError("No active subscription was found.", 404);
    await dodo().subscriptions.update(sub.id, {
      cancel_at_next_billing_date: true,
    });
    await syncSubscription(sub.id);
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
