"use client";

import {
  CalendarClockIcon,
  CalendarRangeIcon,
  LayersIcon,
  WalletIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape returned by the `dashboard.summary` tRPC procedure. */
export type DashboardSummary = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  upcomingRenewalsCount: number;
  currencies: {
    currency: string;
    monthlyEstimateMinor: number;
    annualEstimateMinor: number;
    activeCount: number;
  }[];
};

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
};

function MetricCard({ label, value, hint, icon: Icon, loading }: MetricCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          {loading ? (
            <Skeleton className="mt-0.5 h-6 w-24" />
          ) : (
            <span className="text-xl leading-none font-semibold tracking-tight tabular-nums">
              {value}
            </span>
          )}
          {loading ? (
            <Skeleton className="mt-1 h-3 w-28" />
          ) : hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export type DashboardMetricsProps = {
  summary: DashboardSummary | undefined;
  upcomingCharges: Record<string, number>;
  loading?: boolean;
  className?: string;
};

export function DashboardMetrics({
  summary,
  upcomingCharges,
  loading = false,
  className,
}: DashboardMetricsProps) {
  const currencies = summary?.currencies ?? [];
  const primary = currencies[0];
  const hasMultipleCurrencies = currencies.length > 1;
  const currencyHint = hasMultipleCurrencies
    ? `Largest of ${currencies.length} currencies`
    : undefined;

  const activeCount = summary?.activeSubscriptions ?? 0;
  const totalSubscriptions = summary?.totalSubscriptions ?? 0;

  const upcomingCurrencies = Object.keys(upcomingCharges);
  const upcomingAmount = upcomingCurrencies.length === 1
    ? formatCurrency(
        upcomingCharges[upcomingCurrencies[0]!]!,
        upcomingCurrencies[0]!,
      )
    : null;

  let upcomingHint: string;
  if (upcomingCurrencies.length > 1) {
    upcomingHint = `Due in 30 days across ${upcomingCurrencies.length} currencies`;
  } else if (upcomingAmount) {
    upcomingHint = `${upcomingAmount} due in the next 30 days`;
  } else {
    upcomingHint = "Nothing due in the next 30 days";
  }

  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      <MetricCard
        label="Monthly equivalent"
        icon={WalletIcon}
        loading={loading}
        value={
          primary && primary.monthlyEstimateMinor > 0
            ? formatCurrency(primary.monthlyEstimateMinor, primary.currency)
            : "—"
        }
        hint={
          primary && primary.monthlyEstimateMinor > 0
            ? currencyHint ?? `Across ${activeCount} active subscriptions`
            : "No active subscriptions"
        }
      />
      <MetricCard
        label="Annual equivalent"
        icon={CalendarRangeIcon}
        loading={loading}
        value={
          primary && primary.annualEstimateMinor > 0
            ? formatCurrency(primary.annualEstimateMinor, primary.currency)
            : "—"
        }
        hint={
          primary && primary.annualEstimateMinor > 0
            ? "Monthly equivalent × 12"
            : "No active subscriptions"
        }
      />
      <MetricCard
        label="Active subscriptions"
        icon={LayersIcon}
        loading={loading}
        value={loading ? "" : String(activeCount)}
        hint={`${totalSubscriptions} total tracked`}
      />
      <MetricCard
        label="Upcoming renewals"
        icon={CalendarClockIcon}
        loading={loading}
        value={loading ? "" : String(summary?.upcomingRenewalsCount ?? 0)}
        hint={upcomingHint}
      />
    </div>
  );
}
