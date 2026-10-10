"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  primaryCurrency,
  totalsByCurrency,
  upcomingChargeTotal,
  upcomingRenewals,
  type Subscription,
} from "@/lib/subscription-metrics";
import { trpc } from "@/utils/trpc";

import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { SpendingOverview } from "@/components/dashboard/spending-overview";
import { SubscriptionFormDialog } from "@/components/dashboard/subscription-form-dialog";
import { SubscriptionTable } from "@/components/dashboard/subscription-table";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import {
  ErrorState,
  MetricsSkeleton,
  PanelSkeleton,
  TableSkeleton,
} from "@/components/dashboard/states";
import { useSubscriptions } from "@/components/dashboard/use-subscriptions";

const RENEWAL_WINDOW_DAYS = 30;

export default function DashboardPage() {
  const {
    subscriptions,
    isPending: subscriptionsPending,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptions();

  const {
    data: summary,
    isPending: summaryPending,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(trpc.dashboard.summary.queryOptions());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
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

  const upcoming = useMemo(
    () => upcomingRenewals(rows, { days: RENEWAL_WINDOW_DAYS }),
    [rows],
  );
  const upcomingCharges = useMemo(
    () => upcomingChargeTotal(rows, RENEWAL_WINDOW_DAYS),
    [rows],
  );

  const loading = subscriptionsPending || summaryPending;
  const error = subscriptionsError ?? summaryError;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (subscription: Subscription) => {
    setEditing(subscription);
    setFormOpen(true);
  };

  const retry = () => {
    refetchSubscriptions();
    refetchSummary();
  };

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6 lg:p-8">
        <DashboardHeader onAdd={openCreate} />
        <ErrorState
          description={
            error.message || "Could not load your subscriptions right now."
          }
          onRetry={retry}
        />
        <SubscriptionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          subscription={editing}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
      <DashboardHeader onAdd={openCreate} />

      {loading ? (
        <>
          <MetricsSkeleton />
          <div className="grid gap-4 xl:grid-cols-3">
            <PanelSkeleton className="xl:col-span-2" />
            <PanelSkeleton />
          </div>
          <TableSkeleton />
          <PanelSkeleton />
        </>
      ) : (
        <>
          <DashboardMetrics
            summary={summary}
            upcomingCharges={upcomingCharges}
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <SpendingOverview
              className="xl:col-span-2"
              subscriptions={subscriptions}
              currencies={currencies}
              currency={currency}
              onCurrencyChange={setCurrencySelection}
            />
            <UpcomingRenewals
              subscriptions={subscriptions}
              days={RENEWAL_WINDOW_DAYS}
              limit={5}
              viewAllHref="/renewals"
            />
          </div>

          <SubscriptionTable
            subscriptions={subscriptions}
            onEdit={openEdit}
            onAdd={openCreate}
          />

          <CategoryBreakdown
            subscriptions={subscriptions}
            currencies={currencies}
            currency={currency}
            onCurrencyChange={setCurrencySelection}
          />
        </>
      )}

      <SubscriptionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        subscription={editing}
      />
    </div>
  );
}
