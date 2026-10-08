import { pgEnum } from "drizzle-orm/pg-core";

export const automationRuleTypeEnum = pgEnum("automation_rule_type", [
  "COMMENT",
  "DM",
  "MENTION",
  "KEYWORD",
  "STORY_REPLY",
  "POST_COMMENT",
]);

export const triggerTypeEnum = pgEnum("trigger_type", [
  "KEYWORD",
  "COMMENT",
  "DM",
  "MENTION",
  "STORY_REPLY",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "SEND_DM",
  "REPLY_COMMENT",
  "LIKE_COMMENT",
  "FOLLOW_USER",
  "WAIT",
  "WEBHOOK",
  "GENERATE_AI_REPLY",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "IMAGE",
  "VIDEO",
  "CAROUSEL",
  "STORY",
]);

export const messageDirectionEnum = pgEnum("message_direction", [
  "INBOUND",
  "OUTBOUND",
]);

export const automationRunStatusEnum = pgEnum("automation_run_status", [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
]);

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "RECEIVED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "FREE",
  "PRO",
  "ENTERPRISE",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "CANCELED",
  "PAST_DUE",
  "INCOMPLETE",
  "UNPAID",
]);
