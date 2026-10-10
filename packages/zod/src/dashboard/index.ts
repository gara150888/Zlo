import { z } from "zod";

export const dashboardUpcomingInput = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .optional();

export const dashboardRecentInput = z
  .object({
    limit: z.number().int().min(1).max(50).default(5),
  })
  .optional();

export type DashboardUpcomingInput = z.infer<typeof dashboardUpcomingInput>;
export type DashboardRecentInput = z.infer<typeof dashboardRecentInput>;
