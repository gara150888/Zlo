import { pgTable, pgEnum, text, integer, timestamp, date, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";

export const billingIntervalEnum = pgEnum("billing_interval", [
  "week",
  "month",
  "year",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "paused",
  "cancelled",
  "expired",
  "trial",
]);

export const subscriptionCategoryEnum = pgEnum("subscription_category", [
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

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  provider: text("provider"),
  logoUrl: text("logo_url"),
  // Amount in the currency's minor units.
  // Example: ₹499.00 = 49900 paise.
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("USD"),
  interval: billingIntervalEnum("interval").notNull(),
  intervalCount: integer("interval_count").notNull().default(1),
  startDate: date("start_date", { mode: "string" }).notNull(),
  nextBillingDate: date("next_billing_date", { mode: "string" }),
  trialEndDate: date("trial_end_date", { mode: "string" }),
  category: subscriptionCategoryEnum("category")
    .notNull()
    .default("other"),
  status: subscriptionStatusEnum("status")
    .notNull()
    .default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
},
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_user_status_idx").on(
      table.userId,
      table.status,
    ),
    index("subscriptions_user_billing_date_idx").on(
      table.userId,
      table.nextBillingDate,
    ),
    check(
      "subscriptions_amount_nonnegative",
      sql`${table.amountMinor} >= 0`,
    ),
    check(
      "subscriptions_interval_count_positive",
      sql`${table.intervalCount} > 0`,
    ),
    check(
      "subscriptions_currency_format",
      sql`${table.currency} ~ '^[A-Z]{3}$'`,
    ),
  ],
);
