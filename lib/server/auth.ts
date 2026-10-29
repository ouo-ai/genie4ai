import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "./db";
import { ApiError, hash } from "./http";
const derive = promisify(scrypt);
export const SESSION_COOKIE = "genie_session";
export interface User {
  id: string;
  email: string;
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await derive(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function checkPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  const key = (await derive(password, salt, 64)) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}
export function sessionToken(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(SESSION_COOKIE + "="))
    ?.slice(SESSION_COOKIE.length + 1);
}
export async function userFromRequest(request: Request): Promise<User | null> {
  const token = sessionToken(request);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [user] = await db()<
    User[]
  >`SELECT u.id,u.email FROM genie4ai.sessions s JOIN genie4ai.users u ON u.id=s.user_id WHERE s.token_hash=${hash(token)} AND s.expires_at>now()`;
  return user || null;
}
export async function requireUser(request: Request) {
  const user = await userFromRequest(request);
  if (!user) throw new ApiError("Sign in to continue.", 401);
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db()`INSERT INTO genie4ai.sessions(token_hash,user_id,expires_at) VALUES(${hash(token)},${userId}::uuid,now()+interval '30 days')`;
  return token;
}
