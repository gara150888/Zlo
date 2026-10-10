"use client";

import { useMemo } from "react";
import { PieChartIcon } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { categoryLabels } from "@/lib/subscription-labels";
import {
  categoryBreakdownByCurrency,
  type Subscription,
} from "@/lib/subscription-metrics";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, ListSkeleton } from "./states";

export type CategoryBreakdownProps = {
  subscriptions: Subscription[] | undefined;
  loading?: boolean;
  currencies: string[];
  currency: string | undefined;
  onCurrencyChange: (currency: string) => void;
  className?: string;
};

export function CategoryBreakdown({
  subscriptions,
  loading = false,
  currencies,
  currency,
  onCurrencyChange,
  className,
}: CategoryBreakdownProps) {
  const breakdown = useMemo(
    () => categoryBreakdownByCurrency(subscriptions ?? []),
    [subscriptions],
  );

  const group = breakdown.find((entry) => entry.currency === currency) ?? breakdown[0];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>
              Monthly recurring cost per category
              {group ? ` in ${group.currency}` : ""}.
            </CardDescription>
          </div>
          {currencies.length > 1 ? (
            <Select
              value={currency ?? null}
              onValueChange={(value) => onCurrencyChange(String(value))}
            >
              <SelectTrigger size="sm" className="w-28" aria-label="Currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton rows={4} />
        ) : !group || group.categories.length === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title="No category spending yet"
            description="Active subscriptions are grouped here by category with their share of monthly recurring cost."
          />
        ) : (
          <ul className="grid gap-3">
            {group.categories.map((category) => (
              <li key={category.category} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-sm">
                    {categoryLabels[category.category]}
                    <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                      {category.count} {category.count === 1 ? "sub" : "subs"}
                    </span>
                  </p>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(category.monthlyMinor, group.currency)}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground tabular-nums">
                      {category.percentage}%
                    </span>
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(category.percentage, 1)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
