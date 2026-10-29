export const PLANS = {
  creator: {
    name: "Creator",
    monthlyCents: 10000,
    yearlyCents: 96000,
    allowanceCents: 10000,
    generations: 20,
  },
  pro: {
    name: "Pro",
    monthlyCents: 20000,
    yearlyCents: 192000,
    allowanceCents: 20000,
    generations: 40,
  },
} as const;
export type Plan = keyof typeof PLANS;
export type BillingInterval = "month" | "year";
export const GENERATION_COST_CENTS = 500;
export function isPlan(value: unknown): value is Plan {
  return value === "creator" || value === "pro";
}
export function isInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

/** Calendar months stay anchored to the original UTC day, including Jan 31 and leap years. */
export function addMonths(anchor: Date, months: number) {
  const result = new Date(anchor);
  result.setUTCDate(1);
  result.setUTCMonth(anchor.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(anchor.getUTCDate(), lastDay));
  return result;
}
export function allocationWindow(
  start: Date,
  end: Date,
  interval: BillingInterval,
  now = new Date(),
) {
  if (now < start || now >= end) return null;
  let index = 0;
  if (interval === "year") {
    index = Math.min(
      11,
      Math.max(
        0,
        (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
          now.getUTCMonth() -
          start.getUTCMonth(),
      ),
    );
    if (addMonths(start, index) > now) index--;
  }
  const startsAt = addMonths(start, index);
  const next = interval === "year" ? addMonths(start, index + 1) : end;
  return { index, startsAt, endsAt: next < end ? next : end };
}
