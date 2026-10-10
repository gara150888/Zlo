import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { db } from "@Zlo/db";
import { reminders, subscriptions } from "@Zlo/db/schema";
import {
  reminderListInput,
  reminderUpdateStatusInput,
  reminderRetryInput,
} from "@Zlo/zod/reminder";

import { protectedProcedure, router } from "../index";

export const reminderRouter = router({
  list: protectedProcedure
    .input(reminderListInput)
    .query(async ({ ctx, input }) => {
      const conditions = [eq(reminders.userId, ctx.session.user.id)];

      if (input?.status) {
        conditions.push(eq(reminders.status, input.status));
      }
      if (input?.subscriptionId) {
        conditions.push(eq(reminders.subscriptionId, input.subscriptionId));
      }

      return db
        .select({
          id: reminders.id,
          userId: reminders.userId,
          subscriptionId: reminders.subscriptionId,
          subscriptionName: subscriptions.name,
          daysBefore: reminders.daysBefore,
          scheduledAt: reminders.scheduledAt,
          channel: reminders.channel,
          status: reminders.status,
          dedupeKey: reminders.dedupeKey,
          sentAt: reminders.sentAt,
          attempts: reminders.attempts,
          lastError: reminders.lastError,
          createdAt: reminders.createdAt,
          updatedAt: reminders.updatedAt,
        })
        .from(reminders)
        .leftJoin(subscriptions, eq(reminders.subscriptionId, subscriptions.id))
        .where(and(...conditions))
        .orderBy(desc(reminders.scheduledAt))
        .limit(input?.limit ?? 50);
    }),

  updateStatus: protectedProcedure
    .input(reminderUpdateStatusInput)
    .mutation(async ({ ctx, input }) => {
      const [reminder] = await db
        .update(reminders)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reminders.id, input.id),
            eq(reminders.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!reminder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reminder not found.",
        });
      }

      return reminder;
    }),

  retry: protectedProcedure
    .input(reminderRetryInput)
    .mutation(async ({ ctx, input }) => {
      const [reminder] = await db
        .update(reminders)
        .set({
          status: "pending",
          attempts: 0,
          lastError: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reminders.id, input.id),
            eq(reminders.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!reminder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reminder not found.",
        });
      }

      return reminder;
    }),
});
