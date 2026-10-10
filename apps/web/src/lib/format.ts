/**
 * Locale-aware formatting helpers for money and dates.
 *
 * Money is always stored and transported as integer minor units
 * (e.g. paise, cents). Formatting divides by the currency's own
 * number of minor digits, so JPY renders without decimals and BHD
 * renders with three, instead of assuming every currency has two.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  currency: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat | null {
  const key = `${currency}:${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      ...options,
      style: "currency",
      currency,
    });
    formatterCache.set(key, formatter);
    return formatter;
  } catch {
    return null;
  }
}

/** Number of minor-unit digits used by the given ISO currency. */
export function minorUnitDigits(currency: string): number {
  try {
    const resolved = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).resolvedOptions();
    return resolved.maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** Currency symbol (or code when the symbol is unavailable). */
export function currencySymbol(currency: string): string {
  const formatter = getFormatter(currency, { maximumFractionDigits: 0 });
  if (!formatter) return currency;
  const parts = formatter.formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

/** Formats an integer minor-unit amount, e.g. 49900 + "INR" -> "₹499.00". */
export function formatCurrency(
  minorAmount: number,
  currency: string,
): string {
  const digits = minorUnitDigits(currency);
  const major = minorAmount / 10 ** digits;
  const formatter = getFormatter(currency, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (!formatter) {
    return `${currency} ${major.toFixed(digits)}`;
  }
  return formatter.format(major);
}

/** Compact currency for dense UI such as chart axes, e.g. "$1.2K". */
export function formatCompactCurrency(
  minorAmount: number,
  currency: string,
): string {
  const digits = minorUnitDigits(currency);
  const major = minorAmount / 10 ** digits;
  const fractionDigits = major >= 100_000 ? 0 : major >= 1000 ? 1 : 0;
  const formatter = getFormatter(currency, {
    notation: "compact",
    maximumFractionDigits: fractionDigits,
  });
  if (!formatter) return `${currencySymbol(currency)}${major}`;
  return formatter.format(major);
}

/** Parses a `YYYY-MM-DD` string into a UTC date (no timezone drift). */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

const mediumDateFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  dateStyle: "medium",
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  month: "short",
});

const monthYearFormatter = new Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

/** Formats a `YYYY-MM-DD` string, e.g. "12 Oct 2026". */
export function formatDate(value: string): string {
  return mediumDateFormatter.format(parseDateOnly(value));
}

/** Formats a `YYYY-MM-DD` string compactly, e.g. "12 Oct". */
export function formatShortDate(value: string): string {
  return shortDateFormatter.format(parseDateOnly(value));
}

/** Formats a date as a short month label, e.g. "Oct". */
export function formatMonthLabel(value: Date): string {
  return monthFormatter.format(value);
}

/** Formats a date as month + year, e.g. "Oct 2026". */
export function formatMonthYear(value: Date): string {
  return monthYearFormatter.format(value);
}

/** Whole days from today (local) until a `YYYY-MM-DD` string; negative when past. */
export function daysUntil(value: string): number {
  const target = parseDateOnly(value);
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.round((target.getTime() - todayUtc) / 86_400_000);
}

/** Human label for a renewal date relative to today. */
export function formatRenewalLabel(value: string): string {
  const days = daysUntil(value);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "Yesterday";
  return `${Math.abs(days)} days ago`;
}
