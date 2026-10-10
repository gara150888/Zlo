"use client";

import { CalendarClockIcon } from "lucide-react";
import Link from "next/link";

import { formatCurrency, formatDate, formatRenewalLabel, daysUntil } from "@/lib/format";
import { categoryLabels } from "@/lib/subscription-labels";
import type { AppRoute } from "@/lib/routes";
import { upcomingRenewals, type Subscription } from "@/lib/subscription-metrics";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderAvatar } from "./subscription-bits";
import { EmptyState, ListSkeleton } from "./states";

export type UpcomingRenewalsProps = {
  subscriptions: Subscription[] | undefined;
  loading?: boolean;
  days?: number;
  limit?: number;
  viewAllHref?: AppRoute | null;
  className?: string;
};

export function UpcomingRenewals({
  subscriptions,
  loading = false,
  days = 30,
  limit = 5,
  viewAllHref = "/renewals",
  className,
}: UpcomingRenewalsProps) {
  const renewals = subscriptions
    ? upcomingRenewals(subscriptions, { days, limit })
    : [];

  const description = `Active subscriptions billing in the next ${days} days.`;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>Upcoming renewals</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {viewAllHref ? (
            <Button
              variant="ghost"
              size="xs"
              nativeButton={false}
              render={<Link href={viewAllHref} />}
            >
              View all
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton rows={3} />
        ) : renewals.length === 0 ? (
          <EmptyState
            icon={CalendarClockIcon}
            title="No upcoming renewals"
            description={`Nothing is due in the next ${days} days.`}
          />
        ) : (
          <ul className="divide-y">
            {renewals.map((subscription) => {
              const relative = formatRenewalLabel(subscription.nextBillingDate!);
              const urgent =
                daysUntil(subscription.nextBillingDate!) <= 3;
              return (
                <li
                  key={subscription.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <ProviderAvatar subscription={subscription} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {subscription.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {subscription.provider?.trim() || "No provider"} ·{" "}
                      {categoryLabels[subscription.category]}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(
                        subscription.amountMinor,
                        subscription.currency,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {formatDate(subscription.nextBillingDate!)}
                      </span>{" "}
                      <span className={urgent ? "text-warning" : undefined}>
                        {relative}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
