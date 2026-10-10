"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/format";
import { upcomingChargeTotal, upcomingRenewals } from "@/lib/subscription-metrics";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { ErrorState, PanelSkeleton } from "@/components/dashboard/states";
import { useSubscriptions } from "@/components/dashboard/use-subscriptions";

const WINDOWS = [
  { value: "7", label: "Next 7 days" },
  { value: "30", label: "Next 30 days" },
  { value: "60", label: "Next 60 days" },
  { value: "90", label: "Next 90 days" },
] as const;

const windowLabels: Record<string, string> = Object.fromEntries(
  WINDOWS.map((option) => [option.value, option.label]),
);

export default function RenewalsPage() {
  const { subscriptions, isPending, error, refetch } = useSubscriptions();
  const [window, setWindow] = useState("30");
  const days = Number(window);

  const renewals = useMemo(
    () => upcomingRenewals(subscriptions ?? [], { days }),
    [subscriptions, days],
  );
  const charges = useMemo(
    () => upcomingChargeTotal(subscriptions ?? [], days),
    [subscriptions, days],
  );

  const chargeSummary = Object.entries(charges)
    .map(([currency, minor]) => formatCurrency(minor, currency))
    .join(" · ");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Upcoming renewals"
        description="Active subscriptions sorted by their next billing date."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={window} onValueChange={(value) => setWindow(String(value ?? "30"))}>
          <SelectTrigger size="sm" className="w-36" aria-label="Renewal window">
            <SelectValue>
              {(value) => windowLabels[value ?? ""] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground tabular-nums">
          {renewals.length} renewal{renewals.length === 1 ? "" : "s"}
          {chargeSummary ? ` · ${chargeSummary} due` : ""}
        </p>
      </div>

      {error ? (
        <ErrorState
          description={error.message || "Could not load your subscriptions."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <PanelSkeleton />
      ) : (
        <UpcomingRenewals
          subscriptions={subscriptions}
          days={days}
          limit={50}
          viewAllHref={null}
        />
      )}
    </div>
  );
}
