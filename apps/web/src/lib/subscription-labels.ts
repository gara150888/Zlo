import type {
  BillingInterval,
  SubscriptionCategory,
  SubscriptionStatus,
} from "@Zlo/zod/subscription";

export const billingIntervalLabels: Record<BillingInterval, string> = {
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

/** "Every 2 weeks", "Monthly", "Every 6 months", "Yearly". */
export function formatBillingInterval(
  interval: BillingInterval,
  intervalCount: number,
): string {
  const count = intervalCount > 0 ? intervalCount : 1;
  if (count === 1) return billingIntervalLabels[interval];
  const unit = interval === "week" ? "week" : interval === "month" ? "month" : "year";
  return `Every ${count} ${unit}s`;
}

/** Short cadence label for dense tables, e.g. "2w", "1m", "1y". */
export function formatBillingCadence(
  interval: BillingInterval,
  intervalCount: number,
): string {
  const count = intervalCount > 0 ? intervalCount : 1;
  const unit = interval === "week" ? "w" : interval === "month" ? "mo" : "y";
  return `${count}${unit}`;
}

export const categoryLabels: Record<SubscriptionCategory, string> = {
  streaming: "Streaming",
  music: "Music",
  software: "Software",
  productivity: "Productivity",
  gaming: "Gaming",
  cloud: "Cloud & Storage",
  domain_hosting: "Domain & Hosting",
  education: "Education",
  fitness: "Fitness",
  other: "Other",
};

export const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
  expired: "Expired",
  trial: "Trial",
};

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export const statusTones: Record<SubscriptionStatus, StatusTone> = {
  active: "success",
  paused: "warning",
  cancelled: "neutral",
  expired: "neutral",
  trial: "warning",
};

/**
 * Recurring cost counts `active` subscriptions only. Paused, trial,
 * cancelled and expired subscriptions are excluded everywhere money is
 * aggregated so metrics stay consistent with the backend rules.
 */
export function isRecurring(subscription: {
  status: SubscriptionStatus;
}): boolean {
  return subscription.status === "active";
}
