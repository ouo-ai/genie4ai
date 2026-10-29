import { addMonths, type BillingInterval } from "./plans";
export function validPaidPeriod(
  start: string,
  end: string,
  interval: BillingInterval,
) {
  const a = new Date(start),
    b = new Date(end);
  return (
    Number.isFinite(a.getTime()) &&
    Number.isFinite(b.getTime()) &&
    Math.abs(
      addMonths(a, interval === "year" ? 12 : 1).getTime() - b.getTime(),
    ) < 60000
  );
}
