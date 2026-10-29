import test from "node:test";
import assert from "node:assert/strict";
import { addMonths, allocationWindow, PLANS } from "../lib/plans";
import { validPaidPeriod } from "../lib/billing-policy";
test("annual pricing is exactly 20% below twelve monthly payments", () => {
  for (const p of Object.values(PLANS)) {
    assert.equal(p.yearlyCents, p.monthlyCents * 12 * 0.8);
    assert.equal(p.allowanceCents / 500, p.generations);
  }
});
test("annual credits reset on anchored calendar boundaries without rollover", () => {
  const start = new Date("2028-01-31T12:00:00Z"),
    end = new Date("2029-01-31T12:00:00Z");
  for (const [now, index, reset] of [
    ["2028-02-29T11:59:59Z", 0, "2028-02-29T12:00:00.000Z"],
    ["2028-02-29T12:00:00Z", 1, "2028-03-31T12:00:00.000Z"],
    ["2028-04-30T12:00:00Z", 3, "2028-05-31T12:00:00.000Z"],
    ["2029-01-31T11:59:59Z", 11, "2029-01-31T12:00:00.000Z"],
  ] as const) {
    const window = allocationWindow(start, end, "year", new Date(now));
    assert.equal(window?.index, index);
    assert.equal(window?.endsAt.toISOString(), reset);
  }
  assert.equal(allocationWindow(start, end, "year", end), null);
});
test("receipt periods must cover a full calendar billing interval", () => {
  assert.equal(
    validPaidPeriod("2028-01-31T12:00:00Z", "2028-02-29T12:00:00Z", "month"),
    true,
  );
  assert.equal(
    validPaidPeriod("2028-02-29T12:00:00Z", "2029-02-28T12:00:00Z", "year"),
    true,
  );
  assert.equal(
    validPaidPeriod("2028-01-31T12:00:00Z", "2028-02-15T12:00:00Z", "month"),
    false,
  );
  assert.equal(validPaidPeriod("invalid", "invalid", "year"), false);
  assert.equal(
    addMonths(new Date("2028-01-31T12:00:00Z"), 2).toISOString(),
    "2028-03-31T12:00:00.000Z",
  );
});
