"use client";

import { useMemo } from "react";
import {
  CalendarClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
  formatRenewalLabel,
  daysUntil,
} from "@/lib/format";
import {
  categoryLabels,
  formatBillingCadence,
} from "@/lib/subscription-labels";
import {
  renewalOccurrencesInMonth,
  toDayKey,
  todayLocalUtc,
  type RenewalOccurrence,
  type Subscription,
} from "@/lib/subscription-metrics";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./states";
import { ProviderAvatar } from "./subscription-bits";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_MS = 86_400_000;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;

/** First instant of the `YYYY-MM` key, or `null` when the key is invalid. */
export function parseMonthKey(monthKey: string): Date | null {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

/** `YYYY-MM` key for any date. */
export function monthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}`;
}

/** Moves a `YYYY-MM` key by whole months; `null` when the key is invalid. */
export function shiftMonthKey(monthKey: string, delta: number): string | null {
  const start = parseMonthKey(monthKey);
  if (!start) return null;
  return monthKeyFromDate(
    new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1)),
  );
}

/** Six Monday-first weeks covering the month, so the grid never jumps. */
function buildWeeks(monthStart: Date): Date[] {
  const offset = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = new Date(monthStart.getTime() - offset * DAY_MS);
  return Array.from(
    { length: 42 },
    (_, index) => new Date(gridStart.getTime() + index * DAY_MS),
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-1">
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <Skeleton key={label} className="mx-auto h-3 w-6" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, index) => (
          <Skeleton key={index} className="min-h-16" />
        ))}
      </div>
    </div>
  );
}

export type RenewalsCalendarProps = {
  subscriptions: Subscription[] | undefined;
  loading?: boolean;
  /** Visible month as `YYYY-MM`; owned by the page so it can persist it. */
  monthKey: string;
  /** Selected day as `YYYY-MM-DD`; owned by the page so it can persist it. */
  selectedDay: string;
  onMonthChange: (monthKey: string) => void;
  onSelectDay: (dayKey: string) => void;
  className?: string;
};

export function RenewalsCalendar({
  subscriptions,
  loading = false,
  monthKey,
  selectedDay,
  onMonthChange,
  onSelectDay,
  className,
}: RenewalsCalendarProps) {
  const monthStart = parseMonthKey(monthKey) ?? todayLocalUtc();
  const todayKey = toDayKey(todayLocalUtc());
  const thisMonthKey = monthKeyFromDate(todayLocalUtc());

  const weeks = useMemo(() => buildWeeks(monthStart), [monthStart]);

  const occurrences = useMemo(
    () => (subscriptions ? renewalOccurrencesInMonth(subscriptions, monthStart) : []),
    [subscriptions, monthStart],
  );

  const byDay = useMemo(() => {
    const grouped = new Map<string, RenewalOccurrence[]>();
    for (const occurrence of occurrences) {
      const list = grouped.get(occurrence.date);
      if (list) list.push(occurrence);
      else grouped.set(occurrence.date, [occurrence]);
    }
    return grouped;
  }, [occurrences]);

  const selected = byDay.get(selectedDay) ?? [];

  const dueSummary = useMemo(
    () =>
      Object.entries(
        occurrences.reduce<Record<string, number>>((totals, occurrence) => {
          const { currency, amountMinor } = occurrence.subscription;
          totals[currency] = (totals[currency] ?? 0) + amountMinor;
          return totals;
        }, {}),
      )
        .map(([currency, minor]) => formatCurrency(minor, currency))
        .join(" · "),
    [occurrences],
  );

  const shiftMonth = (delta: number) => {
    const next = shiftMonthKey(monthKey, delta);
    if (next) onMonthChange(next);
  };

  return (
    <Card className={className}>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="size-4 text-muted-foreground" />
            {formatMonthYear(monthStart)}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(thisMonthKey)}
              disabled={monthKey === thisMonthKey}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {occurrences.length} renewal{occurrences.length === 1 ? "" : "s"} this
          month{dueSummary ? ` · ${dueSummary} due` : ""}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          <CalendarSkeleton />
        ) : subscriptions && subscriptions.length === 0 ? (
          <EmptyState
            icon={CalendarClockIcon}
            title="No subscriptions yet"
            description="Add a subscription and its renewals will show up on this calendar."
          />
        ) : (
          <>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1">
              {weeks.map((date) => {
                const dayKey = toDayKey(date);
                const inMonth = monthKeyFromDate(date) === monthKey;
                const dayOccurrences = byDay.get(dayKey) ?? [];
                const isToday = dayKey === todayKey;
                const isSelected = dayKey === selectedDay;
                const daysAway = daysUntil(dayKey);
                const urgent = dayOccurrences.length > 0 && daysAway >= 0 && daysAway <= 3;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    data-day={dayKey}
                    onClick={() => onSelectDay(dayKey)}
                    aria-pressed={isSelected}
                    aria-label={`${formatDate(dayKey)}${dayOccurrences.length > 0
                      ? `, ${dayOccurrences.length} renewal${dayOccurrences.length === 1 ? "" : "s"}`
                      : ", no renewals"
                      }`}
                    className={cn(
                      "flex min-h-16 flex-col gap-1 rounded-md border p-1.5 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border hover:bg-muted/60",
                      dayOccurrences.length > 0 && !isSelected && "border-primary/30 bg-primary/3",
                      !inMonth && "opacity-40",
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          isToday && "font-semibold text-primary",
                          urgent && !isToday && "text-warning",
                        )}
                      >
                        {date.getUTCDate()}
                      </span>
                      {dayOccurrences.length > 0 ? (
                        <span className="rounded-full bg-primary/10 px-1 text-[0.625rem] font-medium tabular-nums text-primary">
                          {dayOccurrences.length}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-auto flex items-center gap-0.5">
                      {dayOccurrences.slice(0, 3).map((occurrence) => (
                        <span
                          key={occurrence.subscription.id}
                          title={occurrence.subscription.name}
                          className="flex"
                        >
                          <ProviderAvatar
                            subscription={occurrence.subscription}
                            className="size-5 sm:size-6.5 rounded-full ring-1 ring-background"
                          />
                        </span>
                      ))}
                      {dayOccurrences.length > 3 ? (
                        <span className="text-[0.625rem] font-medium text-muted-foreground tabular-nums">
                          +{dayOccurrences.length - 3}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="rounded-md border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <div className="grid gap-0.5">
              <p className="text-sm font-medium">{formatDate(selectedDay)}</p>
              <p className="text-xs text-muted-foreground">
                {formatRenewalLabel(selectedDay)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {selected.length} renewal{selected.length === 1 ? "" : "s"} due
            </p>
          </div>
          {selected.length === 0 ? (
            <EmptyState
              icon={CalendarClockIcon}
              title="Nothing renews on this day"
              description="Pick another day on the calendar to see what is due."
            />
          ) : (
            <ul className="divide-y">
              {selected.map((occurrence) => {
                const subscription = occurrence.subscription;
                return (
                  <li
                    key={subscription.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <ProviderAvatar subscription={subscription} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {subscription.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {subscription.provider?.trim() || "No provider"} ·{" "}
                        {categoryLabels[subscription.category]} ·{" "}
                        {formatBillingCadence(
                          subscription.interval,
                          subscription.intervalCount,
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">
                      {formatCurrency(
                        subscription.amountMinor,
                        subscription.currency,
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
