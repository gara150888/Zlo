"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { formatCurrency } from "@/lib/format";
import type { AppRoute } from "@/lib/routes";
import {
  toDayKey,
  todayLocalUtc,
  upcomingChargeTotal,
  upcomingRenewals,
} from "@/lib/subscription-metrics";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { RenewalsCalendar, monthKeyFromDate } from "@/components/dashboard/renewals-calendar";
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

const VIEWS = [
  { value: "calendar", label: "Calendar" },
  { value: "list", label: "List" },
] as const;

type RenewalView = (typeof VIEWS)[number]["value"];

/**
 * View, month, day and window all live in the URL, so a reload, a shared
 * link or the back button restores the exact calendar flow. The view is
 * also mirrored to localStorage so a fresh visit without params keeps
 * the last choice.
 */
const VIEW_STORAGE_KEY = "zlo:renewals-view";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRenewalView(value: string | null): value is RenewalView {
  return value === "calendar" || value === "list";
}

function isValidDayKey(value: string | null): value is string {
  if (!value || !DAY_KEY_PATTERN.test(value)) return false;
  return toDayKey(new Date(`${value}T00:00:00Z`)) === value;
}

function defaultSelectedDay(monthKey: string): string {
  const today = todayLocalUtc();
  return monthKeyFromDate(today) === monthKey
    ? toDayKey(today)
    : `${monthKey}-01`;
}

export default function RenewalsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6 lg:p-8">
          <PageHeader
            title="Upcoming renewals"
            description="Every renewal charge on one calendar. View, month and filters are kept in the URL, so your place survives reloads."
          />
          <PanelSkeleton />
        </div>
      }
    >
      <RenewalsContent />
    </Suspense>
  );
}

function RenewalsContent() {
  const { subscriptions, isPending, error, refetch } = useSubscriptions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [view, setView] = useState<RenewalView>(() => {
    const fromUrl = searchParams.get("view");
    return isRenewalView(fromUrl) ? fromUrl : "calendar";
  });

  const updateParams = (
    updates: Record<string, string | null>,
    mode: "push" | "replace" = "replace",
  ) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    // `typedRoutes: true` brands navigation hrefs; the query string is a
    // runtime-only detail here, so the built `AppRoute` union carries it.
    const href = (query ? `${pathname}?${query}` : pathname) as AppRoute;
    if (mode === "push") router.push(href, { scroll: false });
    else router.replace(href, { scroll: false });
  };

  // A fresh visit without ?view= falls back to the remembered choice.
  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (!isRenewalView(stored) || stored === view) return;
    setView(stored);
    updateParams({ view: stored });
    // Runs once on mount; the URL is the source of truth afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthParam = searchParams.get("month");
  const monthKey =
    monthParam && MONTH_KEY_PATTERN.test(monthParam)
      ? monthParam
      : monthKeyFromDate(todayLocalUtc());

  const dayParam = searchParams.get("day");
  const selectedDay = isValidDayKey(dayParam)
    ? dayParam
    : defaultSelectedDay(monthKey);

  const windowParam = searchParams.get("days");
  const windowValue = WINDOWS.find((option) => option.value === windowParam)?.value ?? "30";
  const days = Number(windowValue);

  const changeView = (next: RenewalView) => {
    setView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    updateParams({ view: next }, "push");
  };

  const changeWindow = (value: string) => {
    updateParams({ days: value === "30" ? null : value });
  };

  const selectDay = (dayKey: string) => {
    updateParams({ day: dayKey, month: dayKey.slice(0, 7) });
  };

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
        description="Every renewal charge on one calendar. View, month and filters are kept in the URL, so your place survives reloads."
      />

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border p-0.5"
          role="group"
          aria-label="Renewals view"
        >
          {VIEWS.map((option) => (
            <Button
              key={option.value}
              size="xs"
              variant={view === option.value ? "secondary" : "ghost"}
              aria-pressed={view === option.value}
              onClick={() => changeView(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {view === "list" ? (
          <Select value={windowValue} onValueChange={(value) => changeWindow(String(value ?? "30"))}>
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
        ) : null}

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
      ) : view === "calendar" ? (
        <RenewalsCalendar
          subscriptions={subscriptions}
          loading={isPending}
          monthKey={monthKey}
          selectedDay={
            selectedDay.slice(0, 7) === monthKey
              ? selectedDay
              : defaultSelectedDay(monthKey)
          }
          onMonthChange={(value) => updateParams({ month: value })}
          onSelectDay={selectDay}
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
