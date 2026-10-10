import { protectedProcedure, publicProcedure, router } from "../index";
import { subscriptionRouter } from "./subscription";
import { dashboardRouter } from "./dashboard";
import { reminderRouter } from "./reminder";
import { reminderPreferenceRouter } from "./reminder-preference";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  subscription: subscriptionRouter,
  dashboard: dashboardRouter,
  reminder: reminderRouter,
  reminderPreference: reminderPreferenceRouter,
  analytics: analyticsRouter,
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});

export type AppRouter = typeof appRouter;

export {
  subscriptionRouter,
  dashboardRouter,
  reminderRouter,
  reminderPreferenceRouter,
  analyticsRouter,
};
