import "server-only";
import { ApiError } from "./http";
export const PROVIDER_BASE = "https://api.worldlabs.ai/marble/v1";
export const MIN_PROVIDER_CREDITS = 1580;
export function providerFetch(path: string, init: RequestInit = {}) {
  if (!process.env.WORLD_LABS_API_KEY)
    throw new ApiError("World generation is temporarily unavailable.", 503);
  return fetch(`${PROVIDER_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "WLT-Api-Key": process.env.WORLD_LABS_API_KEY,
    },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  });
}
let health: { available: boolean; until: number } | undefined;
export async function serviceAvailable() {
  if (health && health.until > Date.now()) return health.available;
  try {
    const response = await providerFetch("/credits");
    const data = await response.json();
    const available =
      response.ok &&
      typeof data.remaining_credits === "number" &&
      data.remaining_credits >= MIN_PROVIDER_CREDITS;
    health = { available, until: Date.now() + 15000 };
    return available;
  } catch {
    return false;
  }
}
export async function requireService() {
  if (!(await serviceAvailable()))
    throw new ApiError(
      "World generation is temporarily unavailable. Billing and new generations are paused. Please try again later.",
      503,
    );
}
export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && !u.username && !u.password) return u.href;
  } catch {}
}
export function parseWorld(data: Record<string, unknown>) {
  if (data.error)
    return {
      status: "failed" as const,
      error:
        "The provider could not finish this world. Your $5 generation credits have been restored.",
    };
  if (typeof data.done !== "boolean")
    throw new Error("Invalid provider result");
  if (!data.done) return { status: "pending" as const };
  const response = data.response as
    { assets?: unknown; world?: unknown } | undefined;
  const world = (response?.assets ? response : response?.world) as
    | {
        assets?: {
          thumbnail_url?: unknown;
          imagery?: { pano_url?: unknown };
          mesh?: { collider_mesh_url?: unknown };
          splats?: {
            spz_urls?: Record<string, unknown>;
            semantics_metadata?: {
              flip_y?: boolean;
              metric_scale_factor?: number;
            };
          };
        };
      }
    | undefined;
  const a = world?.assets;
  const splats = Object.entries(a?.splats?.spz_urls || {}).flatMap(
    ([label, value]) => {
      const url = safeUrl(value);
      return url ? [{ label, url }] : [];
    },
  );
  const panoramaUrl = safeUrl(a?.imagery?.pano_url),
    colliderUrl = safeUrl(a?.mesh?.collider_mesh_url),
    thumbnailUrl = safeUrl(a?.thumbnail_url);
  if (!splats.length && !panoramaUrl && !colliderUrl)
    return {
      status: "failed" as const,
      error:
        "No usable world assets were returned. Your $5 generation credits have been restored.",
    };
  const metadata = a?.splats?.semantics_metadata;
  return {
    status: "completed" as const,
    splats,
    panoramaUrl,
    colliderUrl,
    thumbnailUrl,
    flipY: metadata?.flip_y ?? true,
    metricScale:
      typeof metadata?.metric_scale_factor === "number" &&
      metadata.metric_scale_factor > 0
        ? metadata.metric_scale_factor
        : 1,
  };
}
export function imageInput(value: unknown) {
  if (typeof value !== "string" || value.length > 4194400)
    throw new ApiError("Upload a JPG, PNG or WebP image of up to 3 MB.");
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new ApiError("Upload a JPG, PNG or WebP image.");
  const [, format, base64] = match,
    bytes = Buffer.from(base64, "base64");
  if (
    !bytes.length ||
    bytes.length > 3145728 ||
    bytes.toString("base64") !== base64
  )
    throw new ApiError("Invalid image or image is larger than 3 MB.");
  const valid =
    format === "png"
      ? bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : format === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid)
    throw new ApiError("The file contents do not match the image format.");
  return {
    source: "data_base64",
    data_base64: base64,
    extension: format === "jpeg" ? "jpg" : format,
  };
}
