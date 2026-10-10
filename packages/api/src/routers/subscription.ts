import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { db } from "@Zlo/db";
import { subscriptions, reminders } from "@Zlo/db/schema";
import {
  subscriptionInput,
  subscriptionUpdateInput,
} from "@Zlo/zod/subscription";

import { protectedProcedure, router } from "../index";

export const subscriptionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.session.user.id))
      .orderBy(desc(subscriptions.createdAt));
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      return subscription;
    }),

  create: protectedProcedure
    .input(subscriptionInput)
    .mutation(async ({ ctx, input }) => {
      const [subscription] = await db
        .insert(subscriptions)
        .values({
          id: crypto.randomUUID(),
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      return subscription;
    }),

  update: protectedProcedure
    .input(
      subscriptionUpdateInput.extend({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [subscription] = await db
        .update(subscriptions)
        .set({
          ...data,
          userId: ctx.session.user.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.id, id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      return subscription;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [subscription] = await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      return subscription;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [subscription] = await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      // Automatically cancel any pending reminders for this subscription
      await db
        .update(reminders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reminders.subscriptionId, input.id),
            eq(reminders.userId, ctx.session.user.id),
            eq(reminders.status, "pending"),
          ),
        );

      return subscription;
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [subscription] = await db
        .update(subscriptions)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptions.id, input.id),
            eq(subscriptions.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found.",
        });
      }

      return subscription;
    }),
});