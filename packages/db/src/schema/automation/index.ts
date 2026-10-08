import { index, pgTable, uuid, jsonb, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { actionTypeEnum, automationRunStatusEnum, triggerTypeEnum, automationRuleTypeEnum } from "../enums";
import { instagramAccount } from "../instagram";

export const automationRule = pgTable("automation_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  instagramAccountId: uuid("instagram_account_id")
    .notNull()
    .references(() => instagramAccount.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: automationRuleTypeEnum("type").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
},
  (table) => [
    index("automation_rule_account_id_idx").on(table.instagramAccountId),
    index("automation_rule_account_id_is_active_idx").on(
      table.instagramAccountId,
      table.isActive,
    ),
  ],
);

export const automationTrigger = pgTable("automation_trigger", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => automationRule.id, { onDelete: "cascade" }),
  type: triggerTypeEnum("type").notNull(),
  keywords: jsonb("keywords"),
  conditions: jsonb("conditions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [index("automation_trigger_rule_id_idx").on(table.ruleId)],
);

export const automationAction = pgTable("automation_action", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => automationRule.id, { onDelete: "cascade" }),
  type: actionTypeEnum("type").notNull(),
  config: jsonb("config").notNull(),
  position: text("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [
    index("automation_action_rule_id_idx").on(table.ruleId),
    index("automation_action_rule_id_position_idx").on(table.ruleId, table.position),
  ],
);

export const automationRun = pgTable("automation_run", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => automationRule.id, { onDelete: "cascade" }),
  triggerId: uuid("trigger_id").references(
    () => automationTrigger.id,
    { onDelete: "set null" },
  ),
  status: automationRunStatusEnum("status").notNull().default("PENDING"),
  error: text("error"),
  metadata: jsonb("metadata"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
  (table) => [
    index("automation_run_rule_id_idx").on(table.ruleId),
    index("automation_run_rule_id_status_idx").on(table.ruleId, table.status),
    index("automation_run_trigger_id_idx").on(table.triggerId),
  ],
);
