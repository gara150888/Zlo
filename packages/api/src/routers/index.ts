import { protectedProcedure, publicProcedure, router } from "../index";
import { automationRouter } from "./automation";
import { instagramRouter } from "./instagram";
import { subscriptionRouter } from "./subscription";
import { webhookRouter } from "./webhook";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  instagram: instagramRouter,
  automation: automationRouter,
  subscription: subscriptionRouter,
  webhook: webhookRouter,
});
export type AppRouter = typeof appRouter;
