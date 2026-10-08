import { index, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { webhookEventStatusEnum } from "../enums";
import { instagramAccount } from "../instagram";

export const webhookEvent = pgTable("webhook_event", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalEventId: text("external_event_id").unique(),
  instagramAccountId: uuid("instagram_account_id")
    .references(() => instagramAccount.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at"),
  status: webhookEventStatusEnum("status").notNull().default("RECEIVED"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [
    index("webhook_event_external_id_idx").on(table.externalEventId),
    index("webhook_event_account_id_idx").on(table.instagramAccountId),
    index("webhook_event_status_idx").on(table.status),
    index("webhook_event_created_at_idx").on(table.createdAt),
  ],
);
