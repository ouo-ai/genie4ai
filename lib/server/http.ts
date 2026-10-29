import "server-only";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "./db";
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}
export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export function failure(error: unknown) {
  return error instanceof ApiError
    ? json({ error: error.message }, error.status)
    : json(
        {
          error: "Service is temporarily unavailable. Please try again later.",
        },
        503,
      );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(request.url).origin,
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://genie4ai.ai").origin,
  ]);
  if (
    !origin ||
    !allowed.has(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ApiError("Open Genie 4 AI to continue.", 403);
}
export async function readJson(
  request: Request,
  max = 16384,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError("Send a JSON request.");
  if (Number(request.headers.get("content-length")) > max)
    throw new ApiError("Request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError("Request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > max) {
      await reader.cancel();
      throw new ApiError("Request is too large.", 413);
    }
    chunks.push(part.value);
  }
  let value: unknown;
  try {
    value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError("Invalid JSON request.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ApiError("A JSON object is required.");
  return value as Record<string, unknown>;
}
export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function ipKey(request: Request) {
  return hash(
    request.headers
      .get(process.env.VERCEL ? "x-vercel-forwarded-for" : "x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "local",
  );
}
export async function rateLimit(key: string, max: number, seconds = 900) {
  const bucket = `${key}:${Math.floor(Date.now() / (seconds * 1000))}`;
  const [row] =
    await db()`INSERT INTO genie4ai.rate_limits (key,expires_at) VALUES (${bucket},now()+${seconds}*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET count=genie4ai.rate_limits.count+1 RETURNING count`;
  if (Number(row.count) > max)
    throw new ApiError("Too many requests. Please wait and try again.", 429);
}
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
