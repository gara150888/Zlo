import {
  calculateAnnualEquivalent,
  calculateMonthlyEquivalent,
} from "@Zlo/zod/calculations";
import type {
  BillingInterval,
  SubscriptionCategory,
  SubscriptionStatus,
} from "@Zlo/zod/subscription";

import { isRecurring } from "./subscription-labels";

/**
 * Shape of a subscription record as it arrives on the client.
 * The tRPC client has no transformer, so timestamps arrive as ISO
 * strings instead of `Date` objects.
 */
export type Subscription = {
  id: string;
  name: string;
  provider: string | null;
  logoUrl: string | null;
  amountMinor: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  startDate: string;
  nextBillingDate: string | null;
  trialEndDate: string | null;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyTotals = {
  currency: string;
  monthlyMinor: number;
  annualMinor: number;
  activeCount: number;
  totalCount: number;
};

export type CategoryTotals = {
  category: SubscriptionCategory;
  count: number;
  monthlyMinor: number;
  percentage: number;
};

export type CurrencyCategoryBreakdown = {
  currency: string;
  totalMonthlyMinor: number;
  categories: CategoryTotals[];
};

export type MonthProjection = {
  /** `YYYY-MM` bucket key. */
  key: string;
  /** First day of the bucket month (UTC). */
  date: Date;
  /** Minor-unit totals per currency for that month. */
  totals: Record<string, number>;
  /** Number of charges per currency for that month. */
  counts: Record<string, number>;
};

export type MonthlyProjection = {
  months: MonthProjection[];
  currencies: string[];
};

const DAY_MS = 86_400_000;

export function monthlyEquivalentMinor(subscription: Subscription): number {
  return calculateMonthlyEquivalent(
    subscription.amountMinor,
    subscription.interval,
    subscription.intervalCount,
  );
}

/**
 * Aggregates recurring cost per currency. Different currencies are
 * never combined; there is no exchange-rate policy in the product.
 */
export function totalsByCurrency(
  subscriptions: Subscription[],
): CurrencyTotals[] {
  const byCurrency = new Map<string, CurrencyTotals>();

  for (const subscription of subscriptions) {
    const entry = byCurrency.get(subscription.currency) ?? {
      currency: subscription.currency,
      monthlyMinor: 0,
      annualMinor: 0,
      activeCount: 0,
      totalCount: 0,
    };
    entry.totalCount += 1;
    if (isRecurring(subscription)) {
      entry.monthlyMinor += monthlyEquivalentMinor(subscription);
      entry.activeCount += 1;
    }
    byCurrency.set(subscription.currency, entry);
  }

  return Array.from(byCurrency.values())
    .map((entry) => ({
      ...entry,
      annualMinor: calculateAnnualEquivalent(entry.monthlyMinor),
    }))
    .sort((a, b) => b.monthlyMinor - a.monthlyMinor);
}

/** Currency with the largest recurring cost, for headline metrics. */
export function primaryCurrency(
  totals: CurrencyTotals[],
): CurrencyTotals | undefined {
  return totals[0];
}

export function categoryBreakdownByCurrency(
  subscriptions: Subscription[],
): CurrencyCategoryBreakdown[] {
  const byCurrency = new Map<
    string,
    { totalMonthlyMinor: number; categories: Map<SubscriptionCategory, CategoryTotals> }
  >();

  for (const subscription of subscriptions) {
    if (!isRecurring(subscription)) continue;
    const monthly = monthlyEquivalentMinor(subscription);
    const group =
      byCurrency.get(subscription.currency) ??
      { totalMonthlyMinor: 0, categories: new Map() };

    const entry = group.categories.get(subscription.category) ?? {
      category: subscription.category,
      count: 0,
      monthlyMinor: 0,
      percentage: 0,
    };
    entry.count += 1;
    entry.monthlyMinor += monthly;
    group.categories.set(subscription.category, entry);
    group.totalMonthlyMinor += monthly;
    byCurrency.set(subscription.currency, group);
  }

  return Array.from(byCurrency.entries())
    .map(([currency, group]) => ({
      currency,
      totalMonthlyMinor: group.totalMonthlyMinor,
      categories: Array.from(group.categories.values())
        .map((entry) => ({
          ...entry,
          percentage:
            group.totalMonthlyMinor > 0
              ? Math.round((entry.monthlyMinor / group.totalMonthlyMinor) * 100)
              : 0,
        }))
        .sort((a, b) => b.monthlyMinor - a.monthlyMinor),
    }))
    .sort((a, b) => b.totalMonthlyMinor - a.totalMonthlyMinor);
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

/** Advances a date by `count` intervals, clamping to the target month length. */
export function advanceDate(
  date: Date,
  interval: BillingInterval,
  count: number,
): Date {
  if (interval === "week") {
    return new Date(date.getTime() + count * 7 * DAY_MS);
  }
  const months = interval === "month" ? count : count * 12;
  const day = date.getUTCDate();
  const shifted = new Date(date.getTime());
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  const daysInTarget = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0),
  ).getUTCDate();
  shifted.setUTCDate(Math.min(day, daysInTarget));
  return shifted;
}

function firstOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function todayLocalUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

/**
 * Projects recurring charges per calendar month from real billing
 * cycles. This is a forward projection of existing subscriptions, not
 * historical payment data.
 */
export function projectUpcomingMonths(
  subscriptions: Subscription[],
  options: { months?: number; from?: Date } = {},
): MonthlyProjection {
  const months = options.months ?? 12;
  const from = options.from ?? todayLocalUtc();
  const start = firstOfMonth(from);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1),
  );

  const buckets = new Map<string, MonthProjection>();
  for (let index = 0; index < months; index += 1) {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    buckets.set(toDateKey(date), {
      key: toDateKey(date),
      date,
      totals: {},
      counts: {},
    });
  }

  const currencies = new Set<string>();
  for (const subscription of subscriptions) {
    if (!isRecurring(subscription) || !subscription.nextBillingDate) continue;
    currencies.add(subscription.currency);

    let occurrence = parseDateOnly(subscription.nextBillingDate);
    // A stale billing date in the past still recurs; skip forward so the
    // projection always starts from the current month.
    let guard = 0;
    while (occurrence < start && guard < 600) {
      occurrence = advanceDate(
        occurrence,
        subscription.interval,
        subscription.intervalCount,
      );
      guard += 1;
    }

    while (occurrence < end && guard < 600) {
      const bucket = buckets.get(toDateKey(occurrence));
      if (bucket) {
        bucket.totals[subscription.currency] =
          (bucket.totals[subscription.currency] ?? 0) + subscription.amountMinor;
        bucket.counts[subscription.currency] =
          (bucket.counts[subscription.currency] ?? 0) + 1;
      }
      occurrence = advanceDate(
        occurrence,
        subscription.interval,
        subscription.intervalCount,
      );
      guard += 1;
    }
  }

  return {
    months: Array.from(buckets.values()),
    currencies: Array.from(currencies),
  };
}

/**
 * Active subscriptions whose next billing date falls within the next
 * `days` days, sorted by billing date. Cancelled and expired
 * subscriptions never appear.
 */
export function upcomingRenewals(
  subscriptions: Subscription[],
  options: { days?: number; limit?: number; from?: Date } = {},
): Subscription[] {
  const days = options.days ?? 30;
  const from = options.from ?? todayLocalUtc();
  const today = from.getTime();

  return subscriptions
    .filter((subscription) => {
      if (!isRecurring(subscription) || !subscription.nextBillingDate) {
        return false;
      }
      const diff = Math.round(
        (parseDateOnly(subscription.nextBillingDate).getTime() - today) / DAY_MS,
      );
      return diff >= 0 && diff <= days;
    })
    .sort((a, b) => (a.nextBillingDate ?? "").localeCompare(b.nextBillingDate ?? ""))
    .slice(0, options.limit ?? subscriptions.length);
}

/** Sum of the amounts actually charged within the next `days` days. */
export function upcomingChargeTotal(
  subscriptions: Subscription[],
  days: number,
  from?: Date,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const subscription of upcomingRenewals(subscriptions, { days, from })) {
    totals[subscription.currency] =
      (totals[subscription.currency] ?? 0) + subscription.amountMinor;
  }
  return totals;
}

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (
    value === "active" ||
    value === "paused" ||
    value === "cancelled" ||
    value === "expired" ||
    value === "trial"
  );
}
