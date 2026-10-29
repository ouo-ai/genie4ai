import { requireUser } from "@/lib/server/auth";
import { failure, json, sameOrigin } from "@/lib/server/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request);
    return json({ url: "https://genie4ai.ai/account#billing" });
  } catch (e) {
    return failure(e);
  }
}
