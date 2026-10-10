import { z } from "zod";

export const reminderStatusEnum = z.enum([
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
]);

export const reminderChannelEnum = z.enum(["email"]);

export const reminderListInput = z
  .object({
    status: reminderStatusEnum.optional(),
    subscriptionId: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  })
  .optional();

export const reminderUpdateStatusInput = z.object({
  id: z.string().min(1),
  status: reminderStatusEnum,
});

export const reminderRetryInput = z.object({
  id: z.string().min(1),
});

export type ReminderStatus = z.infer<typeof reminderStatusEnum>;
export type ReminderChannel = z.infer<typeof reminderChannelEnum>;
export type ReminderListInput = z.infer<typeof reminderListInput>;
export type ReminderUpdateStatusInput = z.infer<typeof reminderUpdateStatusInput>;
export type ReminderRetryInput = z.infer<typeof reminderRetryInput>;
