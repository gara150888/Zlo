import { relations } from "drizzle-orm";
import { account, session, user } from "../auth";
import { instagramAccount, instagramComment, instagramMedia, instagramMessage } from "../instagram";
import { automationAction, automationRule, automationRun, automationTrigger } from "../automation";
import { subscription } from "../subscriptions";
import { webhookEvent } from "../webhooks";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  subscriptions: many(subscription),
  instagramAccounts: many(instagramAccount),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const instagramAccountRelations = relations(instagramAccount, ({ one, many }) => ({
  user: one(user, {
    fields: [instagramAccount.userId],
    references: [user.id],
  }),
  media: many(instagramMedia),
  messages: many(instagramMessage),
  automationRules: many(automationRule),
  webhookEvents: many(webhookEvent),
}));

export const instagramMediaRelations = relations(instagramMedia, ({ one, many }) => ({
  account: one(instagramAccount, {
    fields: [instagramMedia.instagramAccountId],
    references: [instagramAccount.id],
  }),
  comments: many(instagramComment),
}));

export const instagramCommentRelations = relations(instagramComment, ({ one, many }) => ({
  media: one(instagramMedia, {
    fields: [instagramComment.mediaId],
    references: [instagramMedia.id],
  }),
  replies: many(instagramComment, {
    relationName: "parentComment",
  }),
}));

export const instagramMessageRelations = relations(instagramMessage, ({ one }) => ({
  account: one(instagramAccount, {
    fields: [instagramMessage.instagramAccountId],
    references: [instagramAccount.id],
  }),
}));

export const automationRuleRelations = relations(automationRule, ({ one, many }) => ({
  account: one(instagramAccount, {
    fields: [automationRule.instagramAccountId],
    references: [instagramAccount.id],
  }),
  triggers: many(automationTrigger),
  actions: many(automationAction),
  runs: many(automationRun),
}));

export const automationTriggerRelations = relations(automationTrigger, ({ one }) => ({
  rule: one(automationRule, {
    fields: [automationTrigger.ruleId],
    references: [automationRule.id],
  }),
}));

export const automationActionRelations = relations(automationAction, ({ one }) => ({
  rule: one(automationRule, {
    fields: [automationAction.ruleId],
    references: [automationRule.id],
  }),
}));

export const automationRunRelations = relations(automationRun, ({ one }) => ({
  rule: one(automationRule, {
    fields: [automationRun.ruleId],
    references: [automationRule.id],
  }),
  trigger: one(automationTrigger, {
    fields: [automationRun.triggerId],
    references: [automationTrigger.id],
  }),
}));

export const webhookEventRelations = relations(webhookEvent, ({ one }) => ({
  account: one(instagramAccount, {
    fields: [webhookEvent.instagramAccountId],
    references: [instagramAccount.id],
  }),
}));
