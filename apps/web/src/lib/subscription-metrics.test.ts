import { describe, expect, it } from "vitest";

import {
  advanceDate,
  categoryBreakdownByCurrency,
  monthlyEquivalentMinor,
  projectUpcomingMonths,
  toDateKey,
  totalsByCurrency,
  upcomingChargeTotal,
  upcomingRenewals,
  type Subscription,
} from "./subscription-metrics";

function makeSubscription(
  overrides: Partial<Subscription> & { id: string },
): Subscription {
  return {
    name: `Subscription ${overrides.id}`,
    provider: "Provider",
    logoUrl: null,
    amountMinor: 1000,
    currency: "USD",
    interval: "month",
    intervalCount: 1,
    startDate: "2026-01-01",
    nextBillingDate: "2099-01-01",
    trialEndDate: null,
    category: "streaming",
    status: "active",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A fixed reference date so projections are deterministic. */
const REFERENCE = new Date(Date.UTC(2026, 9, 15)); // 2026-10-15

describe("monthlyEquivalentMinor", () => {
  it("keeps monthly subscriptions unchanged", () => {
    const subscription = makeSubscription({ id: "a", amountMinor: 499 });
    expect(monthlyEquivalentMinor(subscription)).toBe(499);
  });

  it("divides yearly subscriptions across 12 months", () => {
    const subscription = makeSubscription({
      id: "a",
      amountMinor: 12_000,
      interval: "year",
      intervalCount: 1,
    });
    expect(monthlyEquivalentMinor(subscription)).toBe(1000);
  });

  it("approximates recurring weeks with 52 weeks per year", () => {
    const subscription = makeSubscription({
      id: "a",
      amountMinor: 100,
      interval: "week",
      intervalCount: 2,
    });
    // 100 * 52 / (12 * 2) = 216.67 -> 217
    expect(monthlyEquivalentMinor(subscription)).toBe(217);
  });
});

describe("totalsByCurrency", () => {
  it("aggregates recurring cost per currency without mixing currencies", () => {
    const totals = totalsByCurrency([
      makeSubscription({ id: "a", amountMinor: 1000, currency: "USD" }),
      makeSubscription({ id: "b", amountMinor: 2000, currency: "USD" }),
      makeSubscription({ id: "c", amountMinor: 5000, currency: "EUR" }),
    ]);

    const usd = totals.find((entry) => entry.currency === "USD");
    const eur = totals.find((entry) => entry.currency === "EUR");

    expect(usd?.monthlyMinor).toBe(3000);
    expect(usd?.annualMinor).toBe(36_000);
    expect(usd?.activeCount).toBe(2);
    expect(eur?.monthlyMinor).toBe(5000);
    // Each currency holds its own total; nothing is summed across them.
    expect(totals.reduce((sum, entry) => sum + entry.monthlyMinor, 0)).toBe(8000);
  });

  it("only counts active subscriptions as recurring cost", () => {
    const [totals] = totalsByCurrency([
      makeSubscription({ id: "a", amountMinor: 1000, status: "active" }),
      makeSubscription({ id: "b", amountMinor: 9000, status: "paused" }),
      makeSubscription({ id: "c", amountMinor: 9000, status: "trial" }),
    ]);
    const entry = totals!;

    expect(entry.monthlyMinor).toBe(1000);
    expect(entry.activeCount).toBe(1);
    expect(entry.totalCount).toBe(3);
  });

  it("sorts currencies by largest monthly cost", () => {
    const totals = totalsByCurrency([
      makeSubscription({ id: "a", amountMinor: 100, currency: "USD" }),
      makeSubscription({ id: "b", amountMinor: 9000, currency: "EUR" }),
    ]);
    expect(totals.map((entry) => entry.currency)).toEqual(["EUR", "USD"]);
  });
});

describe("categoryBreakdownByCurrency", () => {
  it("computes percentage shares that add up to 100", () => {
    const [group] = categoryBreakdownByCurrency([
      makeSubscription({ id: "a", amountMinor: 1000, category: "streaming" }),
      makeSubscription({ id: "b", amountMinor: 1000, category: "music" }),
      makeSubscription({ id: "c", amountMinor: 2000, category: "software" }),
    ]);
    const entry = group!;

    expect(entry.totalMonthlyMinor).toBe(4000);
    expect(entry.categories[0]).toMatchObject({
      category: "software",
      monthlyMinor: 2000,
      percentage: 50,
      count: 1,
    });
    expect(entry.categories[2]).toMatchObject({ category: "music", percentage: 25 });
  });

  it("reports zero percentages instead of NaN when recurring cost is zero", () => {
    const [group] = categoryBreakdownByCurrency([
      makeSubscription({ id: "a", amountMinor: 0 }),
    ]);
    const entry = group!;

    expect(entry.totalMonthlyMinor).toBe(0);
    expect(entry.categories[0]?.percentage).toBe(0);
    expect(Number.isNaN(entry.categories[0]?.percentage)).toBe(false);
  });

  it("returns no groups when nothing recurs", () => {
    expect(
      categoryBreakdownByCurrency([
        makeSubscription({ id: "a", status: "cancelled" }),
        makeSubscription({ id: "b", status: "trial" }),
      ]),
    ).toEqual([]);
  });

  it("keeps currencies separate", () => {
    const groups = categoryBreakdownByCurrency([
      makeSubscription({ id: "a", currency: "USD", category: "streaming" }),
      makeSubscription({ id: "b", currency: "EUR", category: "music" }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.currency).toBe("USD");
    expect(groups[0]?.categories[0]?.percentage).toBe(100);
  });
});

describe("advanceDate", () => {
  it("clamps month-end dates to the target month length", () => {
    expect(
      toDateKey(advanceDate(new Date("2026-01-31T00:00:00Z"), "month", 1)),
    ).toBe("2026-02");
    expect(
      toDateKey(advanceDate(new Date("2024-01-31T00:00:00Z"), "month", 1)),
    ).toBe("2024-02");
  });

  it("adds whole weeks", () => {
    expect(
      toDateKey(advanceDate(new Date("2026-10-01T00:00:00Z"), "week", 2)),
    ).toBe("2026-10");
  });
});

describe("projectUpcomingMonths", () => {
  it("projects the same monthly charge into every future month", () => {
    const projection = projectUpcomingMonths(
      [makeSubscription({ id: "a", amountMinor: 1000, nextBillingDate: "2026-10-20" })],
      { months: 3, from: REFERENCE },
    );

    expect(projection.months).toHaveLength(3);
    expect(projection.currencies).toEqual(["USD"]);
    for (const month of projection.months) {
      expect(month.totals.USD).toBe(1000);
      expect(month.counts.USD).toBe(1);
    }
  });

  it("sums multiple charges that fall in the same month", () => {
    const projection = projectUpcomingMonths(
      [
        makeSubscription({ id: "a", amountMinor: 1000, nextBillingDate: "2026-10-20" }),
        makeSubscription({ id: "b", amountMinor: 2500, nextBillingDate: "2026-10-02" }),
      ],
      { months: 1, from: REFERENCE },
    );

    expect(projection.months[0]?.totals.USD).toBe(3500);
    expect(projection.months[0]?.counts.USD).toBe(2);
  });

  it("advances weekly subscriptions four or five times per month", () => {
    const projection = projectUpcomingMonths(
      [
        makeSubscription({
          id: "a",
          amountMinor: 100,
          interval: "week",
          intervalCount: 1,
          nextBillingDate: "2026-10-01",
        }),
      ],
      { months: 1, from: REFERENCE },
    );

    // 01, 08, 15, 22, 29 October.
    expect(projection.months[0]?.counts.USD).toBe(5);
    expect(projection.months[0]?.totals.USD).toBe(500);
  });

  it("skips stale billing dates instead of charging them in the past", () => {
    const projection = projectUpcomingMonths(
      [makeSubscription({ id: "a", amountMinor: 1000, nextBillingDate: "2026-01-05" })],
      { months: 2, from: REFERENCE },
    );

    expect(projection.months.map((month) => month.key)).toEqual(["2026-10", "2026-11"]);
    expect(projection.months[0]?.totals.USD).toBe(1000);
    expect(projection.months[1]?.totals.USD).toBe(1000);
  });

  it("tracks multiple currencies independently", () => {
    const projection = projectUpcomingMonths(
      [
        makeSubscription({ id: "a", amountMinor: 1000, currency: "USD", nextBillingDate: "2026-10-20" }),
        makeSubscription({ id: "b", amountMinor: 700, currency: "EUR", nextBillingDate: "2026-10-20" }),
      ],
      { months: 1, from: REFERENCE },
    );

    expect(projection.currencies).toEqual(["USD", "EUR"]);
    expect(projection.months[0]?.totals).toEqual({ USD: 1000, EUR: 700 });
  });

  it("excludes non-recurring subscriptions", () => {
    const projection = projectUpcomingMonths(
      [makeSubscription({ id: "a", status: "cancelled", nextBillingDate: "2026-10-20" })],
      { months: 2, from: REFERENCE },
    );

    expect(projection.currencies).toEqual([]);
    expect(projection.months[0]?.totals).toEqual({});
  });
});

describe("upcomingRenewals", () => {
  const base = {
    ...makeSubscription({ id: "base" }),
  };

  it("returns active renewals inside the window, sorted by date", () => {
    const renewals = upcomingRenewals(
      [
        makeSubscription({ id: "later", nextBillingDate: "2026-10-25" }),
        makeSubscription({ id: "sooner", nextBillingDate: "2026-10-16" }),
        makeSubscription({ id: "outside", nextBillingDate: "2026-12-30" }),
      ],
      { days: 30, from: REFERENCE, limit: 10 },
    );

    expect(renewals.map((subscription) => subscription.id)).toEqual(["sooner", "later"]);
    expect(base.nextBillingDate).toBe("2099-01-01");
  });

  it("excludes cancelled and expired subscriptions", () => {
    const renewals = upcomingRenewals(
      [
        makeSubscription({ id: "a", status: "cancelled", nextBillingDate: "2026-10-20" }),
        makeSubscription({ id: "b", status: "expired", nextBillingDate: "2026-10-20" }),
      ],
      { days: 30, from: REFERENCE },
    );

    expect(renewals).toHaveLength(0);
  });

  it("respects the limit", () => {
    const renewals = upcomingRenewals(
      [
        makeSubscription({ id: "a", nextBillingDate: "2026-10-20" }),
        makeSubscription({ id: "b", nextBillingDate: "2026-10-21" }),
      ],
      { days: 30, from: REFERENCE, limit: 1 },
    );

    expect(renewals).toHaveLength(1);
  });
});

describe("upcomingChargeTotal", () => {
  it("sums charges per currency within the window", () => {
    const totals = upcomingChargeTotal(
      [
        makeSubscription({ id: "a", amountMinor: 1000, currency: "USD", nextBillingDate: "2026-10-20" }),
        makeSubscription({ id: "b", amountMinor: 2000, currency: "USD", nextBillingDate: "2026-10-21" }),
        makeSubscription({ id: "c", amountMinor: 700, currency: "EUR", nextBillingDate: "2026-10-22" }),
      ],
      30,
    );

    expect(totals).toEqual({ USD: 3000, EUR: 700 });
  });
});
