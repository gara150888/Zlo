import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { subscriptionPlanEnum, subscriptionStatusEnum } from "../enums";
import { user } from "../auth";

export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull().default("FREE"),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
},
  (table) => [
    index("subscription_user_id_idx").on(table.userId),
    index("subscription_user_id_status_idx").on(table.userId, table.status),
  ],
);
