import { z } from "zod";

import { minorUnitDigits } from "./format";
import type { SubscriptionInput } from "@Zlo/zod/subscription";

export const billingIntervals = ["week", "month", "year"] as const;

export const subscriptionCategories = [
  "streaming",
  "music",
  "software",
  "productivity",
  "gaming",
  "cloud",
  "domain_hosting",
  "education",
  "fitness",
  "other",
] as const;

export const subscriptionStatuses = [
  "active",
  "paused",
  "cancelled",
  "expired",
  "trial",
] as const;

/** Currencies offered in the subscription form. */
export const currencyOptions = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "INR", label: "Indian Rupee" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "NOK", label: "Norwegian Krone" },
  { code: "DKK", label: "Danish Krone" },
  { code: "PLN", label: "Polish Zloty" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "ZAR", label: "South African Rand" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "KRW", label: "South Korean Won" },
  { code: "TRY", label: "Turkish Lira" },
] as const;

/**
 * Label lookup for the currency select. Base UI cannot resolve an item's
 * label while the popup is closed, so the trigger reads labels from here
 * instead of showing the raw currency code.
 */
export const currencyLabels: Record<string, string> = Object.fromEntries(
  currencyOptions.map((option) => [
    option.code,
    `${option.code} — ${option.label}`,
  ]),
);

/**
 * Form values are kept as strings: text and date inputs produce strings,
 * and `amount` is typed in major units (e.g. "499.00"). Conversion to
 * server payload shape happens in {@link toSubscriptionInput}.
 */
export type SubscriptionFormValues = {
  name: string;
  provider: string;
  logoUrl: string;
  amount: string;
  currency: string;
  interval: string;
  intervalCount: string;
  startDate: string;
  nextBillingDate: string;
  trialEndDate: string;
  category: string;
  status: string;
  notes: string;
};

export const subscriptionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Keep the name under 100 characters"),
  provider: z.string().trim().max(100, "Keep the provider under 100 characters"),
  logoUrl: z
    .string()
    .trim()
    .max(500, "Keep the logo URL under 500 characters")
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/.test(value),
      "Enter a valid http(s) URL",
    ),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((value) => Number.isFinite(Number(value)), "Enter a valid amount")
    .refine((value) => Number(value) > 0, "Enter an amount greater than zero")
    .refine(
      (value) => Number(value) <= 1_000_000,
      "Amount is too large",
    ),
  currency: z
    .string()
    .refine(
      (value) => currencyOptions.some((option) => option.code === value),
      "Select a currency",
    ),
  interval: z.enum(billingIntervals),
  intervalCount: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number")
    .refine((value) => Number(value) >= 1, "Must be at least 1")
    .refine((value) => Number(value) <= 120, "Must be 120 or less"),
  startDate: z.string().min(1, "Pick a start date"),
  nextBillingDate: z.string(),
  trialEndDate: z.string(),
  category: z.enum(subscriptionCategories),
  status: z.enum(subscriptionStatuses),
  notes: z.string().max(1000, "Keep notes under 1000 characters"),
});

export const defaultFormValues: SubscriptionFormValues = {
  name: "",
  provider: "",
  logoUrl: "",
  amount: "",
  currency: "USD",
  interval: "month",
  intervalCount: "1",
  startDate: new Date().toISOString().slice(0, 10),
  nextBillingDate: new Date().toISOString().slice(0, 10),
  trialEndDate: "",
  category: "other",
  status: "active",
  notes: "",
};

/** Converts validated form values into the server payload shape. */
export function toSubscriptionInput(
  values: SubscriptionFormValues,
): SubscriptionInput {
  const digits = minorUnitDigits(values.currency);
  return {
    name: values.name.trim(),
    provider: values.provider.trim() || null,
    logoUrl: values.logoUrl.trim() || null,
    amountMinor: Math.round(Number(values.amount) * 10 ** digits),
    currency: values.currency,
    interval: values.interval as SubscriptionInput["interval"],
    intervalCount: Number(values.intervalCount),
    startDate: values.startDate,
    nextBillingDate: values.nextBillingDate || null,
    trialEndDate: values.trialEndDate || null,
    category: values.category as SubscriptionInput["category"],
    status: values.status as SubscriptionInput["status"],
    notes: values.notes.trim() || null,
  };
}

/** Formats a major-unit amount for display in the amount input. */
export function formatMajorAmount(minorAmount: number, currency: string): string {
  const digits = minorUnitDigits(currency);
  const major = minorAmount / 10 ** digits;
  return String(Number(major.toFixed(digits)));
}
