import { z } from "zod";

export const billingIntervalEnum = z.enum(["week", "month", "year"]);

export const subscriptionCategoryEnum = z.enum([
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
]);

export const subscriptionStatusEnum = z.enum([
  "active",
  "paused",
  "cancelled",
  "expired",
  "trial",
]);

export const subscriptionInput = z.object({
  name: z.string().trim().min(1).max(100),
  provider: z.string().trim().max(100).optional().nullable(),
  // Uploaded logos are stored as inline data URLs, so this is larger than a plain link.
  logoUrl: z.string().trim().max(20_000).optional().nullable(),
  amountMinor: z.number().int().min(0).max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/).default("INR"),
  interval: billingIntervalEnum,
  intervalCount: z.number().int().min(1).max(120).default(1),
  startDate: z.string().date(),
  nextBillingDate: z.string().date().optional().nullable(),
  trialEndDate: z.string().date().optional().nullable(),
  category: subscriptionCategoryEnum.default("other"),
  status: subscriptionStatusEnum.default("active"),
  notes: z.string().max(1000).optional().nullable(),
});

export const subscriptionUpdateInput = subscriptionInput.partial();
export const subscriptionIdInput = z.object({ id: z.string().min(1) });

export type SubscriptionInput = z.infer<typeof subscriptionInput>;
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateInput>;
export type SubscriptionIdInput = z.infer<typeof subscriptionIdInput>;
export type BillingInterval = z.infer<typeof billingIntervalEnum>;
export type SubscriptionCategory = z.infer<typeof subscriptionCategoryEnum>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;