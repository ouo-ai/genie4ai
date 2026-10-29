import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  ApiError,
  failure,
  json,
  rateLimit,
  readJson,
  sameOrigin,
} from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request),
      body = await readJson(request);
    await rateLimit(`support:${user.id}`, 5, 3600);
    if (
      !["generation", "billing", "account", "privacy"].includes(
        String(body.category),
      ) ||
      typeof body.message !== "string" ||
      body.message.trim().length < 15 ||
      body.message.length > 4000
    )
      throw new ApiError("Choose a topic and enter 15–4,000 characters.");
    const id = randomUUID();
    await db()`INSERT INTO genie4ai.support_requests(id,user_id,category,message) VALUES(${id}::uuid,${user.id}::uuid,${String(body.category)},${body.message.trim()})`;
    return json({ id });
  } catch (e) {
    return failure(e);
  }
}
