"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { formatCurrency } from "@/lib/format";
import {
  primaryCurrency,
  totalsByCurrency,
  type Subscription,
} from "@/lib/subscription-metrics";
import { trpc } from "@/utils/trpc";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import {
  DashboardMetrics,
  type DashboardSummary,
} from "@/components/dashboard/dashboard-metrics";
import { SpendingOverview } from "@/components/dashboard/spending-overview";
import {
  ErrorState,
  MetricsSkeleton,
  PanelSkeleton,
} from "@/components/dashboard/states";
import { useSubscriptions } from "@/components/dashboard/use-subscriptions";

const UPCOMING_WINDOWS = [
  { key: "next7Days", label: "Next 7 days" },
  { key: "next30Days", label: "Next 30 days" },
  { key: "next90Days", label: "Next 90 days" },
] as const;

export default function AnalyticsPage() {
  const { subscriptions, isPending: subscriptionsPending, error: subscriptionsError, refetch: refetchSubscriptions } =
    useSubscriptions();
  const {
    data: monthlySpending,
    isPending: monthlyPending,
    error: monthlyError,
  } = useQuery(trpc.analytics.monthlySpending.queryOptions());
  const { data: upcomingCosts, isPending: upcomingPending } = useQuery(
    trpc.analytics.upcomingCosts.queryOptions(),
  );

  const [currencySelection, setCurrencySelection] = useState<string | null>(null);

  const rows = subscriptions ?? [];
  const totals = useMemo(() => totalsByCurrency(rows), [rows]);
  const currencies = useMemo(
    () => totals.map((entry) => entry.currency),
    [totals],
  );
  const currency = useMemo(() => {
    if (currencySelection && currencies.includes(currencySelection)) {
      return currencySelection;
    }
    return primaryCurrency(totals)?.currency;
  }, [currencySelection, currencies, totals]);

  const loading = subscriptionsPending || monthlyPending;
  const error = subscriptionsError ?? monthlyError;

  const summary: DashboardSummary | undefined = monthlySpending
    ? {
        totalSubscriptions: monthlySpending.totalCount,
        activeSubscriptions: monthlySpending.activeCount,
        upcomingRenewalsCount: upcomingCosts?.next30Days.count ?? 0,
        currencies: monthlySpending.currencies.map((entry) => ({
          currency: entry.currency,
          monthlyEstimateMinor: entry.totalMonthlyMinor,
          annualEstimateMinor: entry.totalAnnualMinor,
          activeCount: monthlySpending.activeCount,
        })),
      }
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
      <PageHeader
        title="Analytics"
        description="Recurring cost estimates from your current subscriptions. These are projections, not payment history."
      />

      {error ? (
        <ErrorState
          description={error.message || "Could not load analytics."}
          onRetry={() => refetchSubscriptions()}
        />
      ) : (
        <>
          {loading ? (
            <MetricsSkeleton />
          ) : (
            <DashboardMetrics summary={summary} upcomingCharges={{}} />
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            <SpendingOverview
              className="xl:col-span-2"
              subscriptions={subscriptions}
              currencies={currencies}
              currency={currency}
              onCurrencyChange={setCurrencySelection}
            />

            <Card>
              <CardHeader>
                <CardTitle>Renewal windows</CardTitle>
                <CardDescription>
                  Amounts actually charged in each upcoming window.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {upcomingPending || !upcomingCosts ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  UPCOMING_WINDOWS.map((window) => {
                    const entry = upcomingCosts[window.key];
                    const costs = Object.entries(entry.costsMinor)
                      .map(([code, minor]) => formatCurrency(minor, code))
                      .join(" · ");
                    return (
                      <div
                        key={window.key}
                        className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                      >
                        <p className="text-sm">{window.label}</p>
                        <div className="text-right">
                          <p className="text-sm font-medium tabular-nums">
                            {costs || "Nothing due"}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {entry.count} charge{entry.count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <PanelSkeleton />
          ) : (
            <CategoryBreakdown
              subscriptions={subscriptions}
              currencies={currencies}
              currency={currency}
              onCurrencyChange={setCurrencySelection}
            />
          )}
        </>
      )}
    </div>
  );
}
