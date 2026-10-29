import { randomUUID } from "node:crypto";
import { db } from "@/lib/server/db";
import {
  ApiError,
  failure,
  hash,
  ipKey,
  json,
  rateLimit,
  readJson,
  sameOrigin,
} from "@/lib/server/http";
import {
  checkPassword,
  createSession,
  passwordHash,
  SESSION_COOKIE,
  sessionToken,
} from "@/lib/server/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const body = await readJson(request);
    if (body.action === "logout") {
      const token = sessionToken(request);
      if (token)
        await db()`DELETE FROM genie4ai.sessions WHERE token_hash=${hash(token)}`;
      const response = json({ success: true });
      response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        secure: new URL(request.url).protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    if (body.action !== "register" && body.action !== "login")
      throw new ApiError("Invalid account action.");
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 12 ||
      Buffer.byteLength(password) > 256
    )
      throw new ApiError(
        "Enter a valid email and a password of 12–256 characters.",
      );
    await rateLimit(`auth-ip:${ipKey(request)}`, 30);
    await rateLimit(`auth-email:${hash(email)}`, 10);
    let userId: string;
    if (body.action === "register") {
      const id = randomUUID();
      const encoded = await passwordHash(password);
      const [created] =
        await db()`INSERT INTO genie4ai.users(id,email,password_hash) VALUES(${id}::uuid,${email},${encoded}) ON CONFLICT(email) DO NOTHING RETURNING id`;
      if (!created)
        throw new ApiError(
          "Unable to create this account. If you already registered, sign in.",
          409,
        );
      userId = id;
    } else {
      const [user] =
        await db()`SELECT id,password_hash FROM genie4ai.users WHERE email=${email}`;
      const stored =
        user?.password_hash ||
        "00000000000000000000000000000000:" + "0".repeat(128);
      if (!(await checkPassword(password, stored)) || !user)
        throw new ApiError("Email or password is incorrect.", 401);
      userId = user.id;
    }
    const token = await createSession(userId);
    const response = json({ user: { id: userId, email }, success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 86400,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
