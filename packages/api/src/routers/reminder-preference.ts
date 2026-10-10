import { eq } from "drizzle-orm";

import { db } from "@Zlo/db";
import { reminderPreferences } from "@Zlo/db/schema";
import { reminderPreferenceUpdateInput } from "@Zlo/zod/reminder-preference";

import { protectedProcedure, router } from "../index";

export const reminderPreferenceRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [pref] = await db
      .select()
      .from(reminderPreferences)
      .where(eq(reminderPreferences.userId, ctx.session.user.id))
      .limit(1);

    if (!pref) {
      return {
        userId: ctx.session.user.id,
        emailEnabled: true,
        reminderDays: [3, 1],
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return pref;
  }),

  update: protectedProcedure
    .input(reminderPreferenceUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const [pref] = await db
        .insert(reminderPreferences)
        .values({
          userId: ctx.session.user.id,
          emailEnabled: input.emailEnabled ?? true,
          reminderDays: input.reminderDays ?? [3, 1],
          timezone: input.timezone ?? "Asia/Kolkata",
        })
        .onConflictDoUpdate({
          target: reminderPreferences.userId,
          set: {
            ...(input.emailEnabled !== undefined
              ? { emailEnabled: input.emailEnabled }
              : {}),
            ...(input.reminderDays !== undefined
              ? { reminderDays: input.reminderDays }
              : {}),
            ...(input.timezone !== undefined
              ? { timezone: input.timezone }
              : {}),
            updatedAt: new Date(),
          },
        })
        .returning();

      return pref;
    }),
});
