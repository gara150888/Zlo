import { z } from "zod";
import { router, protectedProcedure } from "../index";
import { getSubscription, upsertSubscription } from "../server/services/subscription";

const planSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);
const statusSchema = z.enum(["ACTIVE", "CANCELED", "PAST_DUE", "INCOMPLETE", "UNPAID"]);

export const subscriptionRouter = router({
  get: protectedProcedure.query(({ ctx }) => getSubscription(ctx.session.user.id)),
  upsert: protectedProcedure
    .input(
      z.object({
        plan: planSchema,
        status: statusSchema,
        currentPeriodStart: z.coerce.date(),
        currentPeriodEnd: z.coerce.date(),
      }),
    )
    .mutation(({ ctx, input }) =>
      upsertSubscription(ctx.session.user.id, input),
    ),
});

export type SubscriptionRouter = typeof subscriptionRouter;
