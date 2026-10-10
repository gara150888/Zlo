"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLabel,
  formatMonthYear,
} from "@/lib/format";
import { projectUpcomingMonths, type Subscription } from "@/lib/subscription-metrics";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PanelSkeleton } from "./states";

const MONTH_COUNT = 12;
const CHART_HEIGHT = 220;
const PADDING = { top: 12, right: 8, bottom: 22, left: 46 };

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => {
      const next = element.getBoundingClientRect().width;
      if (next > 0) setWidth(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export type SpendingOverviewProps = {
  subscriptions: Subscription[] | undefined;
  loading?: boolean;
  currencies: string[];
  currency: string | undefined;
  onCurrencyChange: (currency: string) => void;
  className?: string;
};

export function SpendingOverview({
  subscriptions,
  loading = false,
  currencies,
  currency,
  onCurrencyChange,
  className,
}: SpendingOverviewProps) {
  const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>(680);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const projection = useMemo(
    () =>
      subscriptions
        ? projectUpcomingMonths(subscriptions, { months: MONTH_COUNT })
        : null,
    [subscriptions],
  );

  const series = useMemo(() => {
    if (!projection || !currency) return [];
    return projection.months.map((month) => ({
      key: month.key,
      date: month.date,
      minor: month.totals[currency] ?? 0,
      count: month.counts[currency] ?? 0,
    }));
  }, [projection, currency]);

  const maxMinor = useMemo(
    () => series.reduce((max, point) => Math.max(max, point.minor), 0),
    [series],
  );
  const totalMinor = useMemo(
    () => series.reduce((sum, point) => sum + point.minor, 0),
    [series],
  );

  const hasRecurring = Boolean(currency) && maxMinor > 0;

  const width = Math.max(containerWidth, 320);
  const innerWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const yMax = niceCeiling(maxMinor);

  const xAt = (index: number) =>
    PADDING.left +
    (series.length > 1 ? (index * innerWidth) / (series.length - 1) : innerWidth / 2);
  const yAt = (minor: number) =>
    PADDING.top + innerHeight * (1 - minor / yMax);

  const linePath = series
    .map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index)} ${yAt(point.minor)}`)
    .join(" ");
  const areaPath = series.length
    ? `${linePath} L${xAt(series.length - 1)} ${PADDING.top + innerHeight} L${xAt(0)} ${PADDING.top + innerHeight} Z`
    : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMax * ratio);
  const labelInterval = Math.max(
    1,
    Math.ceil(MONTH_COUNT / Math.max(1, Math.floor(width / 56))),
  );

  const activePoint = activeIndex !== null ? series[activeIndex] : undefined;

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const ratio = (x - PADDING.left) / innerWidth;
    const index = Math.round(ratio * (series.length - 1));
    setActiveIndex(Math.min(Math.max(index, 0), series.length - 1));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActiveIndex((current) => {
        const next = (current ?? 0) + step;
        return Math.min(Math.max(next, 0), series.length - 1);
      });
    }
    if (event.key === "Escape") setActiveIndex(null);
  };

  if (loading) {
    return <PanelSkeleton className={className} />;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Spending overview</CardTitle>
          <CardDescription>
            Projected recurring charges from your subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Nothing to project yet"
            description="Add your first subscription and its billing cycle to see projected recurring costs."
          />
        </CardContent>
      </Card>
    );
  }

  if (!hasRecurring) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Spending overview</CardTitle>
          <CardDescription>
            Projected recurring charges from your subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No recurring costs to project"
            description="Active subscriptions with a billing cycle produce a projection. Paused, cancelled and expired subscriptions are excluded."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>Spending overview</CardTitle>
            <CardDescription>
              Projected recurring charges over the next {MONTH_COUNT} months,
              based on each subscription&apos;s billing cycle.
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
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <p className="text-xs text-muted-foreground">
            12-month total{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(totalMinor, currency!)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Average per month{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(Math.round(totalMinor / MONTH_COUNT), currency!)}
            </span>
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative touch-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-md"
          tabIndex={0}
          role="group"
          aria-label="Projected monthly recurring cost. Use arrow keys to inspect each month."
          onPointerMove={handlePointer}
          onPointerLeave={() => setActiveIndex(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setActiveIndex(null)}
        >
          <svg
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
            className="overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="spending-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={yAt(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {formatCompactCurrency(tick, currency!)}
                </text>
              </g>
            ))}

            {series.map((point, index) =>
              index % labelInterval === 0 || index === series.length - 1 ? (
                <text
                  key={point.key}
                  x={xAt(index)}
                  y={CHART_HEIGHT - 6}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === series.length - 1
                        ? "end"
                        : "middle"
                  }
                  className="fill-muted-foreground text-[10px]"
                >
                  {formatMonthLabel(point.date)}
                </text>
              ) : null,
            )}

            <path d={areaPath} fill="url(#spending-area)" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {activeIndex !== null && activePoint ? (
              <>
                <line
                  x1={xAt(activeIndex)}
                  x2={xAt(activeIndex)}
                  y1={PADDING.top}
                  y2={PADDING.top + innerHeight}
                  className="stroke-border-strong"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xAt(activeIndex)}
                  cy={yAt(activePoint.minor)}
                  r={3.5}
                  className="fill-primary stroke-background"
                  strokeWidth={2}
                />
              </>
            ) : null}
          </svg>

          {activeIndex !== null && activePoint ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs shadow-md"
              style={{
                left: `${(xAt(activeIndex) / width) * 100}%`,
                top: yAt(activePoint.minor) - 8,
              }}
            >
              <p className="font-medium">{formatMonthYear(activePoint.date)}</p>
              <p className="text-muted-foreground tabular-nums">
                {formatCurrency(activePoint.minor, currency!)}
                {activePoint.count > 0
                  ? ` · ${activePoint.count} charge${activePoint.count === 1 ? "" : "s"}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Forward projection from current subscriptions and billing cycles —
          not payment history.
          {currencies.length > 1
            ? ` Amounts shown in ${currency}; other currencies are excluded.`
            : ""}
        </p>
      </CardContent>
    </Card>
  );
}
