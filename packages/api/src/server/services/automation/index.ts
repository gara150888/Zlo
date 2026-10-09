// import { eq, and, desc } from "drizzle-orm";
// import { TRPCError } from "@trpc/server";
// import { db } from "@Zlo/db";
// import * as schema from "@Zlo/db/schema/index";

// const {
//   automationRule,
//   automationTrigger,
//   automationAction,
//   automationRun,
// } = schema;

// export async function listAutomationRules(userId: string, accountId: string) {
//   const account = await db.query.instagramAccount.findFirst({
//     where: and(
//       eq(schema.instagramAccount.id, accountId),
//       eq(schema.instagramAccount.userId, userId),
//     ),
//   });

//   if (!account) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Instagram account not found",
//     });
//   }

//   return db.query.automationRule.findMany({
//     where: eq(automationRule.instagramAccountId, accountId),
//     orderBy: [desc(automationRule.createdAt)],
//     with: {
//       triggers: true,
//       actions: true,
//       runs: true,
//     },
//   });
// }

// export async function getAutomationRule(userId: string, ruleId: string) {
//   const rule = await db.query.automationRule.findFirst({
//     where: eq(automationRule.id, ruleId),
//     with: {
//       account: true,
//       triggers: true,
//       actions: true,
//     },
//   });

//   if (!rule || rule.account.userId !== userId) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Automation rule not found",
//     });
//   }

//   return rule;
// }

// export async function createAutomationRule(
//   userId: string,
//   data: {
//     instagramAccountId: string;
//     name: string;
//     description?: string;
//     type: string;
//     triggers: Array<{
//       type: string;
//       keywords?: string[];
//       conditions?: Record<string, unknown>;
//     }>;
//     actions: Array<{
//       type: string;
//       config: Record<string, unknown>;
//       position: number;
//     }>;
//   },
// ) {
//   const account = await db.query.instagramAccount.findFirst({
//     where: and(
//       eq(schema.instagramAccount.id, data.instagramAccountId),
//       eq(schema.instagramAccount.userId, userId),
//     ),
//   });

//   if (!account) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Instagram account not found",
//     });
//   }

//   const [rule] = await db.insert(automationRule).values({
//     instagramAccountId: data.instagramAccountId,
//     name: data.name,
//     description: data.description,
//     type: data.type as "COMMENT" | "DM" | "MENTION" | "KEYWORD" | "STORY_REPLY" | "POST_COMMENT",
//   }).returning();

//   if (!rule) {
//     throw new TRPCError({
//       code: "INTERNAL_SERVER_ERROR",
//       message: "Failed to create automation rule",
//     });
//   }

//   await db.insert(automationTrigger).values(
//     data.triggers.map((trigger) => ({
//       ruleId: rule.id,
//       type: trigger.type as "KEYWORD" | "COMMENT" | "DM" | "MENTION" | "STORY_REPLY",
//       keywords: trigger.keywords ?? null,
//       conditions: trigger.conditions ?? {},
//     })),
//   );

//   await db.insert(automationAction).values(
//     data.actions.map((action) => ({
//       ruleId: rule.id,
//       type: action.type as "SEND_DM" | "REPLY_COMMENT" | "LIKE_COMMENT" | "FOLLOW_USER" | "WAIT" | "WEBHOOK" | "GENERATE_AI_REPLY",
//       config: action.config,
//       position: String(action.position),
//     })),
//   );

//   return getAutomationRule(userId, rule.id);
// }

// export async function updateAutomationRule(
//   userId: string,
//   ruleId: string,
//   data: {
//     name?: string;
//     description?: string;
//     type?: string;
//     isActive?: boolean;
//     triggers?: Array<{
//       type: string;
//       keywords?: string[];
//       conditions?: Record<string, unknown>;
//     }>;
//     actions?: Array<{
//       type: string;
//       config: Record<string, unknown>;
//       position: number;
//     }>;
//   },
// ) {
//   const rule = await db.query.automationRule.findFirst({
//     where: eq(automationRule.id, ruleId),
//     with: { account: true },
//   });

//   if (!rule || rule.account.userId !== userId) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Automation rule not found",
//     });
//   }

//   const updateValues: Record<string, unknown> = {};
//   if (data.name !== undefined) updateValues.name = data.name;
//   if (data.description !== undefined) updateValues.description = data.description;
//   if (data.type !== undefined) updateValues.type = data.type;
//   if (data.isActive !== undefined) updateValues.isActive = data.isActive;

//   if (updateValues && Object.keys(updateValues).length > 0) {
//     await db.update(automationRule).set(updateValues).where(eq(automationRule.id, ruleId));
//   }

//   if (data.triggers) {
//     await db.delete(automationTrigger).where(eq(automationTrigger.ruleId, ruleId));
//     await db.insert(automationTrigger).values(
//       data.triggers.map((trigger) => ({
//         ruleId: rule.id,
//         type: trigger.type as "KEYWORD" | "COMMENT" | "DM" | "MENTION" | "STORY_REPLY",
//         keywords: trigger.keywords ?? null,
//         conditions: trigger.conditions ?? {},
//       })),
//     );
//   }

//   if (data.actions) {
//     await db.delete(automationAction).where(eq(automationAction.ruleId, ruleId));
//     await db.insert(automationAction).values(
//       data.actions.map((action) => ({
//         ruleId: rule.id,
//         type: action.type as "SEND_DM" | "REPLY_COMMENT" | "LIKE_COMMENT" | "FOLLOW_USER" | "WAIT" | "WEBHOOK" | "GENERATE_AI_REPLY",
//         config: action.config,
//         position: String(action.position),
//       })),
//     );
//   }

//   return getAutomationRule(userId, ruleId);
// }

// export async function deleteAutomationRule(userId: string, ruleId: string) {
//   const rule = await db.query.automationRule.findFirst({
//     where: eq(automationRule.id, ruleId),
//     with: { account: true },
//   });

//   if (!rule || rule.account.userId !== userId) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Automation rule not found",
//     });
//   }

//   await db.delete(automationRule).where(eq(automationRule.id, ruleId));
//   return { success: true };
// }

// export async function listAutomationRuns(
//   userId: string,
//   ruleId: string,
//   limit = 20,
//   cursor?: string,
// ) {
//   const rule = await db.query.automationRule.findFirst({
//     where: eq(automationRule.id, ruleId),
//     with: { account: true },
//   });

//   if (!rule || rule.account.userId !== userId) {
//     throw new TRPCError({
//       code: "NOT_FOUND",
//       message: "Automation rule not found",
//     });
//   }

//   const conditions = [eq(automationRun.ruleId, ruleId)];
//   if (cursor) {
//     conditions.push(eq(automationRun.createdAt, new Date(cursor)));
//   }

//   const runs = await db.query.automationRun.findMany({
//     where: and(...conditions),
//     orderBy: [desc(automationRun.createdAt)],
//     limit: limit + 1,
//   });

//   let nextCursor: string | undefined;
//   if (runs.length > limit) {
//     const next = runs.pop();
//     nextCursor = next!.createdAt.toISOString();
//   }

//   return { runs, nextCursor };
// }
