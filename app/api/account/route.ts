import { userFromRequest } from "@/lib/server/auth";
import { accountCredits, publicJob, type Job } from "@/lib/server/credits";
import { db } from "@/lib/server/db";
import { failure, json } from "@/lib/server/http";
import { serviceAvailable } from "@/lib/server/provider";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await userFromRequest(request),
      available = await serviceAvailable();
    if (!user) return json({ user: null, serviceAvailable: available });
    const [window, jobs, subscriptions] = await Promise.all([
      accountCredits(user.id),
      db()<
        Job[]
      >`SELECT * FROM genie4ai.jobs WHERE user_id=${user.id}::uuid ORDER BY created_at DESC LIMIT 30`,
      db()`SELECT status,cancel_at_end FROM genie4ai.subscriptions WHERE user_id=${user.id}::uuid ORDER BY updated_at DESC LIMIT 1`,
    ]);
    const balanceCents = window
      ? window.allowance_cents - window.used_cents
      : 0;
    return json({
      user,
      cancelAtEnd: subscriptions[0]?.cancel_at_end || false,
      subscriptionStatus: subscriptions[0]?.status || null,
      serviceAvailable: available,
      balanceCents,
      generationsRemaining: Math.floor(balanceCents / 500),
      plan: window?.plan || null,
      interval: window?.interval || null,
      renewsAt: window?.period_end || null,
      creditResetAt: window?.ends_at || null,
      jobs: jobs.map(publicJob),
    });
  } catch (e) {
    return failure(e);
  }
}
