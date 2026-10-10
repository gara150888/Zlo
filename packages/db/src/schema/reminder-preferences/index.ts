
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";

export const reminderPreferences = pgTable("reminder_preferences", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  // Defaults: 3 days and 1 day before renewal.
  reminderDays: integer("reminder_days")
    .array()
    .notNull()
    .default([3, 1]),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
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
    primaryKey({ columns: [table.userId] }),
    check(
      "reminder_days_valid",
      sql`array_position(${table.reminderDays}, NULL) IS NULL AND ${table.reminderDays} <@ ARRAY[1, 3, 7, 14, 30]::integer[]`,
    ),
  ],
);
