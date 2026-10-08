import { z } from "zod";
import { router, protectedProcedure } from "../index";
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRule,
  listAutomationRuns,
  listAutomationRules,
  updateAutomationRule,
} from "../server/services/automation";

const triggerTypeSchema = z.enum([
  "KEYWORD",
  "COMMENT",
  "DM",
  "MENTION",
  "STORY_REPLY",
]);

const actionTypeSchema = z.enum([
  "SEND_DM",
  "REPLY_COMMENT",
  "LIKE_COMMENT",
  "FOLLOW_USER",
  "WAIT",
  "WEBHOOK",
  "GENERATE_AI_REPLY",
]);

const ruleTypeSchema = z.enum([
  "COMMENT",
  "DM",
  "MENTION",
  "KEYWORD",
  "STORY_REPLY",
  "POST_COMMENT",
]);

const triggerInputSchema = z.object({
  type: triggerTypeSchema,
  keywords: z.array(z.string()).optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
});

const actionInputSchema = z.object({
  type: actionTypeSchema,
  config: z.record(z.string(), z.unknown()),
  position: z.number().int().min(0),
});

const createRuleInputSchema = z.object({
  instagramAccountId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: ruleTypeSchema,
  triggers: z.array(triggerInputSchema).min(1),
  actions: z.array(actionInputSchema).min(1),
});

const updateRuleInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: ruleTypeSchema.optional(),
  isActive: z.boolean().optional(),
  triggers: z.array(triggerInputSchema).optional(),
  actions: z.array(actionInputSchema).optional(),
});

export const automationRouter = router({
  rules: {
    list: protectedProcedure
      .input(z.object({ accountId: z.string() }))
      .query(({ ctx, input }) =>
        listAutomationRules(ctx.session.user.id, input.accountId),
      ),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) => getAutomationRule(ctx.session.user.id, input.id)),
    create: protectedProcedure
      .input(createRuleInputSchema)
      .mutation(({ ctx, input }) =>
        createAutomationRule(ctx.session.user.id, input),
      ),
    update: protectedProcedure
      .input(updateRuleInputSchema)
      .mutation(({ ctx, input }) => {
        const { id, ...rest } = input;
        return updateAutomationRule(ctx.session.user.id, id, rest);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteAutomationRule(ctx.session.user.id, input.id),
      ),
  },
  runs: {
    list: protectedProcedure
      .input(
        z.object({
          ruleId: z.string(),
          limit: z.number().int().min(1).max(100).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) =>
        listAutomationRuns(ctx.session.user.id, input.ruleId, input.limit, input.cursor),
      ),
  },
});

export type AutomationRouter = typeof automationRouter;
