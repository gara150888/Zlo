import { z } from "zod";

export const reminderPreferenceUpdateInput = z.object({
  emailEnabled: z.boolean().optional(),
  reminderDays: z
    .array(
      z.number().int().refine((val) => [1, 3, 7, 14, 30].includes(val), {
        message: "Reminder days must be one of: 1, 3, 7, 14, 30",
      }),
    )
    .min(1)
    .optional(),
  timezone: z.string().trim().min(1).max(100).optional(),
});

export type ReminderPreferenceUpdateInput = z.infer<
  typeof reminderPreferenceUpdateInput
>;
