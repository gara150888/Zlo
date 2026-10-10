import { and, asc, desc, eq, gte } from "drizzle-orm";

import { db } from "@Zlo/db";
import { subscriptions } from "@Zlo/db/schema";
import {
  calculateMonthlyEquivalent,
  calculateAnnualEquivalent,
} from "@Zlo/zod/calculations";
import {
  dashboardUpcomingInput,
  dashboardRecentInput,
} from "@Zlo/zod/dashboard";

import { protectedProcedure, router } from "../index";

export const dashboardRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const allSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.session.user.id));

    const activeSubs = allSubs.filter((s) => s.status === "active");

    const todayStr = new Date().toISOString().split("T")[0]!;
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]!;

    const upcomingRenewalsCount = activeSubs.filter(
      (s) =>
        s.nextBillingDate &&
        s.nextBillingDate >= todayStr &&
        s.nextBillingDate <= thirtyDaysLater,
    ).length;

    // Recurring cost is aggregated per currency. The product has no
    // exchange-rate policy, so amounts in different currencies are never
    // summed into one figure.
    const currencyMap = new Map<
      string,
      { monthlyEstimateMinor: number; activeCount: number }
    >();
    for (const sub of activeSubs) {
      const entry = currencyMap.get(sub.currency) ?? {
        monthlyEstimateMinor: 0,
        activeCount: 0,
      };
      entry.monthlyEstimateMinor += calculateMonthlyEquivalent(
        sub.amountMinor,
        sub.interval,
        sub.intervalCount,
      );
      entry.activeCount += 1;
      currencyMap.set(sub.currency, entry);
    }

    const currencies = Array.from(currencyMap.entries())
      .map(([currency, data]) => ({
        currency,
        monthlyEstimateMinor: data.monthlyEstimateMinor,
        annualEstimateMinor: calculateAnnualEquivalent(
          data.monthlyEstimateMinor,
        ),
        activeCount: data.activeCount,
      }))
      .sort((a, b) => b.monthlyEstimateMinor - a.monthlyEstimateMinor);

    return {
      totalSubscriptions: allSubs.length,
      activeSubscriptions: activeSubs.length,
      upcomingRenewalsCount,
      currencies,
    };
  }),

  upcoming: protectedProcedure
    .input(dashboardUpcomingInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10;
      const todayStr = new Date().toISOString().split("T")[0]!;

      return db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.session.user.id),
            eq(subscriptions.status, "active"),
            gte(subscriptions.nextBillingDate, todayStr),
          ),
        )
        .orderBy(asc(subscriptions.nextBillingDate))
        .limit(limit);
    }),

  recent: protectedProcedure
    .input(dashboardRecentInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;

      return db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.session.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(limit);
    }),
});
