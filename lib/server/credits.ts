import "server-only";
import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import {
  allocationWindow,
  GENERATION_COST_CENTS,
  type BillingInterval,
  type Plan,
} from "../plans";
import { db } from "./db";
import { ApiError } from "./http";
type Tx = postgres.TransactionSql;
interface Period {
  payment_id: string;
  plan: Plan;
  interval: BillingInterval;
  period_start: Date;
  period_end: Date;
  allowance_cents: number;
  subscription_id: string;
}
export interface CreditWindow {
  id: string;
  allowance_cents: number;
  used_cents: number;
  ends_at: Date;
  plan: Plan;
  interval: BillingInterval;
  period_end: Date;
  subscription_id: string;
}
export interface Job {
  id: string;
  user_id: string;
  request_hash: string;
  provider_id: string | null;
  status: "pending" | "completed" | "failed" | "uncertain";
  result: Record<string, unknown> | null;
  created_at: Date;
  window_id: string;
  refunded: boolean;
}
export async function currentWindow(
  sql: Tx,
  userId: string,
): Promise<CreditWindow | null> {
  const [period] = await sql<
    Period[]
  >`SELECT p.* FROM genie4ai.billing_periods p JOIN genie4ai.subscriptions s ON s.id=p.subscription_id
    WHERE p.user_id=${userId}::uuid AND p.revoked=false AND p.period_start<=now() AND p.period_end>now()
      AND s.status IN ('active','cancelled','past_due') ORDER BY p.period_end DESC,p.period_start DESC LIMIT 1`;
  if (!period) return null;
  const span = allocationWindow(
    new Date(period.period_start),
    new Date(period.period_end),
    period.interval,
  );
  if (!span) return null;
  const id = randomUUID();
  await sql`INSERT INTO genie4ai.credit_windows(id,payment_id,month_index,starts_at,ends_at,allowance_cents)
    VALUES(${id}::uuid,${period.payment_id},${span.index},${span.startsAt},${span.endsAt},${period.allowance_cents}) ON CONFLICT(payment_id,month_index) DO NOTHING`;
  const [window] =
    await sql`SELECT * FROM genie4ai.credit_windows WHERE payment_id=${period.payment_id} AND month_index=${span.index}`;
  return {
    ...window,
    plan: period.plan,
    interval: period.interval,
    period_end: period.period_end,
    subscription_id: period.subscription_id,
  } as CreditWindow;
}
export async function accountCredits(userId: string) {
  return db().begin((sql) => currentWindow(sql, userId));
}
export function publicJob(job: Job) {
  const stale =
    !job.provider_id &&
    job.status === "pending" &&
    Date.now() - new Date(job.created_at).getTime() > 90000;
  return {
    ...(job.result || {}),
    operationId: job.id,
    status: stale ? "uncertain" : job.status,
    createdAt: job.created_at,
    ...(stale
      ? {
          error:
            "Submission could not be confirmed. Do not resubmit this request. Contact support with the job ID.",
        }
      : {}),
    refunded: job.refunded,
  };
}
export async function existingJob(id: string, userId: string) {
  const [job] = await db()<
    Job[]
  >`SELECT * FROM genie4ai.jobs WHERE id=${id}::uuid AND user_id=${userId}::uuid`;
  return job;
}
export async function reserveJob(
  id: string,
  userId: string,
  requestHash: string,
) {
  return db().begin(async (sql) => {
    await sql`SELECT id FROM genie4ai.users WHERE id=${userId}::uuid FOR UPDATE`;
    const [previous] = await sql<
      Job[]
    >`SELECT * FROM genie4ai.jobs WHERE id=${id}::uuid`;
    if (previous) {
      if (previous.user_id !== userId || previous.request_hash !== requestHash)
        throw new ApiError("Request ID is already in use.", 409);
      return { job: previous, created: false };
    }
    const window = await currentWindow(sql, userId);
    if (
      !window ||
      window.allowance_cents - window.used_cents < GENERATION_COST_CENTS
    )
      throw new ApiError(
        "You need at least $5 in generation credits. Choose a plan or wait for your next allocation.",
        402,
      );
    const [{ count }] =
      await sql`SELECT count(*)::integer AS count FROM genie4ai.jobs WHERE user_id=${userId}::uuid AND status IN ('pending','uncertain') AND created_at>now()-interval '30 minutes'`;
    if (count >= 2)
      throw new ApiError(
        "Wait for your current worlds to finish before submitting another.",
        409,
      );
    const [debited] =
      await sql`UPDATE genie4ai.credit_windows SET used_cents=used_cents+${GENERATION_COST_CENTS} WHERE id=${window.id}::uuid AND used_cents+${GENERATION_COST_CENTS}<=allowance_cents RETURNING id`;
    if (!debited) throw new ApiError("Insufficient generation credits.", 402);
    const [job] = await sql<
      Job[]
    >`INSERT INTO genie4ai.jobs(id,user_id,window_id,request_hash) VALUES(${id}::uuid,${userId}::uuid,${window.id}::uuid,${requestHash}) RETURNING *`;
    return { job, created: true };
  });
}
export async function finishJob(
  id: string,
  result: Record<string, unknown> & { status: Job["status"] },
) {
  return db().begin(async (sql) => {
    const [job] = await sql<
      Job[]
    >`SELECT * FROM genie4ai.jobs WHERE id=${id}::uuid FOR UPDATE`;
    if (!job || job.status === "completed" || job.status === "failed") return;
    const refund = result.status === "failed" && !job.refunded;
    if (refund)
      await sql`UPDATE genie4ai.credit_windows SET used_cents=greatest(0,used_cents-${GENERATION_COST_CENTS}) WHERE id=${job.window_id}::uuid`;
    await sql`UPDATE genie4ai.jobs SET status=${result.status},result=${sql.json(result as postgres.JSONValue)},refunded=${job.refunded || refund} WHERE id=${id}::uuid`;
  });
}
