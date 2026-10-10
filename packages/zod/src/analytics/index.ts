import { z } from "zod";

export const analyticsQueryInput = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  })
  .optional();

export type AnalyticsQueryInput = z.infer<typeof analyticsQueryInput>;
