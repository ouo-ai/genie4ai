import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { existingJob, finishJob, publicJob } from "@/lib/server/credits";
import { ApiError, failure, json, rateLimit, UUID } from "@/lib/server/http";
import { parseWorld, providerFetch } from "@/lib/server/provider";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const user = await requireUser(request),
      id = new URL(request.url).searchParams.get("id");
    if (!id || !UUID.test(id))
      throw new ApiError("A valid job ID is required.");
    await rateLimit(`status:${user.id}`, 180, 60);
    let job = await existingJob(id, user.id);
    if (!job) throw new ApiError("World not found.", 404);
    if (
      job.provider_id &&
      (job.status === "pending" || job.status === "uncertain")
    ) {
      const [lease] =
        await db()`UPDATE genie4ai.jobs SET next_check_at=now()+interval '8 seconds' WHERE id=${id}::uuid AND next_check_at<=now() RETURNING id`;
      if (lease) {
        try {
          const response = await providerFetch(
            `/operations/${encodeURIComponent(job.provider_id)}`,
          );
          if (response.ok)
            await finishJob(id, parseWorld(await response.json()));
        } catch {}
        job = await existingJob(id, user.id);
      }
    }
    return json(publicJob(job));
  } catch (e) {
    return failure(e);
  }
}
