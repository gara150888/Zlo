
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { subscriptions } from "../subscription";
import { user } from "../auth";

export const reminderStatusEnum = pgEnum("reminder_status", [
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
]);

export const reminderChannelEnum = pgEnum("reminder_channel", [
  "email",
]);

export const reminders = pgTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  // Number of days before renewal.
  daysBefore: integer("days_before").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  channel: reminderChannelEnum("channel").notNull().default("email"),
  status: reminderStatusEnum("status").notNull().default("pending"),
  dedupeKey: text("dedupe_key").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
},
  (table) => [
    index("reminders_due_idx").on(table.status, table.scheduledAt),
    index("reminders_user_id_idx").on(table.userId),
    uniqueIndex("reminders_dedupe_key_idx").on(table.dedupeKey),
  ],
);
