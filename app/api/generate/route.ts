import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import {
  existingJob,
  finishJob,
  publicJob,
  reserveJob,
} from "@/lib/server/credits";
import {
  ApiError,
  failure,
  hash,
  json,
  rateLimit,
  readJson,
  sameOrigin,
  UUID,
} from "@/lib/server/http";
import {
  imageInput,
  providerFetch,
  requireService,
} from "@/lib/server/provider";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request);
    await rateLimit(`generate:${user.id}`, 30, 3600);
    const body = await readJson(request, 4300000);
    if (typeof body.requestId !== "string" || !UUID.test(body.requestId))
      throw new ApiError("A valid request ID is required.");
    if (body.mode !== "image" && body.mode !== "text")
      throw new ApiError("Choose image or text mode.");
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length > 1500 || (body.mode === "text" && !prompt))
      throw new ApiError("Describe your world in 1–1,500 characters.");
    const worldPrompt =
      body.mode === "image"
        ? {
            type: "image",
            image_prompt: imageInput(body.imageDataUrl),
            ...(prompt ? { text_prompt: prompt } : {}),
          }
        : { type: "text", text_prompt: prompt };
    const requestHash = hash(JSON.stringify(worldPrompt));
    const previous = await existingJob(body.requestId, user.id);
    if (previous) {
      if (previous.request_hash !== requestHash)
        throw new ApiError(
          "This request ID belongs to a different generation.",
          409,
        );
      return json(publicJob(previous));
    }
    await requireService();
    const reserved = await reserveJob(body.requestId, user.id, requestHash);
    if (!reserved.created) return json(publicJob(reserved.job));
    try {
      const response = await providerFetch("/worlds:generate", {
        method: "POST",
        body: JSON.stringify({
          display_name: "Genie 4 AI world",
          model: "marble-1.1",
          permission: { public: false },
          world_prompt: worldPrompt,
        }),
      });
      if (!response.ok) {
        const definitive = [400, 401, 402, 403, 404, 413, 422, 429].includes(
          response.status,
        );
        await finishJob(body.requestId, {
          status: definitive ? "failed" : "uncertain",
          error: definitive
            ? "The provider rejected this generation. Your $5 generation credits have been restored."
            : "Submission could not be confirmed. Do not resubmit. Contact support with this job ID.",
        });
      } else {
        const data = await response.json();
        if (
          typeof data.operation_id !== "string" ||
          !/^[a-zA-Z0-9_-]{1,160}$/.test(data.operation_id)
        )
          throw new Error("Missing operation");
        await db()`UPDATE genie4ai.jobs SET provider_id=${data.operation_id},next_check_at=now()+interval '5 seconds' WHERE id=${body.requestId}::uuid`;
      }
    } catch {
      await finishJob(body.requestId, {
        status: "uncertain",
        error:
          "Submission could not be confirmed. Do not resubmit. Contact support with this job ID.",
      });
    }
    const job = await existingJob(body.requestId, user.id);
    return json(publicJob(job));
  } catch (e) {
    return failure(e);
  }
}
