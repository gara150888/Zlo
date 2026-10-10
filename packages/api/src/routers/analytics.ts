import { and, asc, eq, gte } from "drizzle-orm";

import { db } from "@Zlo/db";
import { subscriptions } from "@Zlo/db/schema";
import {
  calculateMonthlyEquivalent,
  calculateAnnualEquivalent,
} from "@Zlo/zod/calculations";
import { analyticsQueryInput } from "@Zlo/zod/analytics";

import { protectedProcedure, router } from "../index";

export const analyticsRouter = router({
  spendingByCategory: protectedProcedure
    .input(analyticsQueryInput)
    .query(async ({ ctx }) => {
      const activeSubs = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.session.user.id),
            eq(subscriptions.status, "active"),
          ),
        );

      const categoryMap = new Map<
        string,
        {
          totalMonthlyMinor: number;
          categories: Map<
            string,
            { count: number; monthlyEquivalentMinor: number }
          >;
        }
      >();

      for (const sub of activeSubs) {
        const monthly = calculateMonthlyEquivalent(
          sub.amountMinor,
          sub.interval,
          sub.intervalCount,
        );

        const group = categoryMap.get(sub.currency) ?? {
          totalMonthlyMinor: 0,
          categories: new Map(),
        };
        const current = group.categories.get(sub.category) ?? {
          count: 0,
          monthlyEquivalentMinor: 0,
        };
        group.categories.set(sub.category, {
          count: current.count + 1,
          monthlyEquivalentMinor: current.monthlyEquivalentMinor + monthly,
        });
        group.totalMonthlyMinor += monthly;
        categoryMap.set(sub.currency, group);
      }

      // Amounts are grouped per currency: unlike currencies are never
      // summed because there is no exchange-rate policy.
      const currencies = Array.from(categoryMap.entries())
        .map(([currency, group]) => ({
          currency,
          totalMonthlyMinor: group.totalMonthlyMinor,
          categories: Array.from(group.categories.entries())
            .map(([category, data]) => ({
              category,
              count: data.count,
              monthlyEquivalentMinor: data.monthlyEquivalentMinor,
              percentage:
                group.totalMonthlyMinor > 0
                  ? Math.round(
                      (data.monthlyEquivalentMinor / group.totalMonthlyMinor) *
                        100,
                    )
                  : 0,
            }))
            .sort(
              (a, b) => b.monthlyEquivalentMinor - a.monthlyEquivalentMinor,
            ),
        }))
        .sort((a, b) => b.totalMonthlyMinor - a.totalMonthlyMinor);

      return { currencies };
    }),

  monthlySpending: protectedProcedure
    .input(analyticsQueryInput)
    .query(async ({ ctx }) => {
      const userSubs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.session.user.id));

      const activeSubs = userSubs.filter((s) => s.status === "active");

      type IntervalTotals = {
        count: number;
        totalMinor: number;
        monthlyEquivalentMinor: number;
      };
      const emptyIntervalTotals = (): Record<
        "week" | "month" | "year",
        IntervalTotals
      > => ({
        week: { count: 0, totalMinor: 0, monthlyEquivalentMinor: 0 },
        month: { count: 0, totalMinor: 0, monthlyEquivalentMinor: 0 },
        year: { count: 0, totalMinor: 0, monthlyEquivalentMinor: 0 },
      });

      // Each currency is aggregated separately; unlike currencies are
      // never summed without an exchange-rate policy.
      const currencyMap = new Map<
        string,
        { totalMonthlyMinor: number; intervalBreakdown: ReturnType<typeof emptyIntervalTotals> }
      >();

      for (const sub of activeSubs) {
        const monthly = calculateMonthlyEquivalent(
          sub.amountMinor,
          sub.interval,
          sub.intervalCount,
        );

        const group = currencyMap.get(sub.currency) ?? {
          totalMonthlyMinor: 0,
          intervalBreakdown: emptyIntervalTotals(),
        };

        group.totalMonthlyMinor += monthly;
        const item = group.intervalBreakdown[sub.interval];
        item.count += 1;
        item.totalMinor += sub.amountMinor;
        item.monthlyEquivalentMinor += monthly;
        currencyMap.set(sub.currency, group);
      }

      const currencies = Array.from(currencyMap.entries())
        .map(([currency, group]) => ({
          currency,
          totalMonthlyMinor: group.totalMonthlyMinor,
          totalAnnualMinor: calculateAnnualEquivalent(group.totalMonthlyMinor),
          intervalBreakdown: group.intervalBreakdown,
        }))
        .sort((a, b) => b.totalMonthlyMinor - a.totalMonthlyMinor);

      const statusBreakdown = {
        active: userSubs.filter((s) => s.status === "active").length,
        paused: userSubs.filter((s) => s.status === "paused").length,
        cancelled: userSubs.filter((s) => s.status === "cancelled").length,
        expired: userSubs.filter((s) => s.status === "expired").length,
        trial: userSubs.filter((s) => s.status === "trial").length,
      };

      return {
        currencies,
        statusBreakdown,
        activeCount: activeSubs.length,
        totalCount: userSubs.length,
      };
    }),

  upcomingCosts: protectedProcedure
    .input(analyticsQueryInput)
    .query(async ({ ctx }) => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]!;

      const dateIn7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;
      const dateIn30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;
      const dateIn90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]!;

      const activeSubs = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.session.user.id),
            eq(subscriptions.status, "active"),
            gte(subscriptions.nextBillingDate, todayStr),
          ),
        )
        .orderBy(asc(subscriptions.nextBillingDate));

      let next7DaysCount = 0;
      let next30DaysCount = 0;
      let next90DaysCount = 0;
      const next7DaysCost: Record<string, number> = {};
      const next30DaysCost: Record<string, number> = {};
      const next90DaysCost: Record<string, number> = {};

      for (const sub of activeSubs) {
        if (!sub.nextBillingDate) continue;
        if (sub.nextBillingDate <= dateIn7) {
          next7DaysCount++;
          next7DaysCost[sub.currency] =
            (next7DaysCost[sub.currency] ?? 0) + sub.amountMinor;
        }
        if (sub.nextBillingDate <= dateIn30) {
          next30DaysCount++;
          next30DaysCost[sub.currency] =
            (next30DaysCost[sub.currency] ?? 0) + sub.amountMinor;
        }
        if (sub.nextBillingDate <= dateIn90) {
          next90DaysCount++;
          next90DaysCost[sub.currency] =
            (next90DaysCost[sub.currency] ?? 0) + sub.amountMinor;
        }
      }

      return {
        next7Days: { count: next7DaysCount, costsMinor: next7DaysCost },
        next30Days: { count: next30DaysCount, costsMinor: next30DaysCost },
        next90Days: { count: next90DaysCount, costsMinor: next90DaysCost },
        upcomingSubscriptions: activeSubs.slice(0, 10).map((s) => ({
          id: s.id,
          name: s.name,
          provider: s.provider,
          amountMinor: s.amountMinor,
          currency: s.currency,
          nextBillingDate: s.nextBillingDate,
          category: s.category,
        })),
      };
    }),
});
