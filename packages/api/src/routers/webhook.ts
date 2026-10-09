// import { z } from "zod";
// import { router, protectedProcedure } from "../index";
// import {
//   getWebhookEvent,
//   listWebhookEvents,
//   markWebhookProcessed,
// } from "../server/services/webhook";

// export const webhookRouter = router({
//   events: {
//     list: protectedProcedure
//       .input(
//         z.object({
//           limit: z.number().int().min(1).max(100).default(20),
//           cursor: z.string().optional(),
//         }),
//       )
//       .query(({ ctx, input }) =>
//         listWebhookEvents(ctx.session.user.id, input.limit, input.cursor),
//       ),
//     get: protectedProcedure
//       .input(z.object({ id: z.string() }))
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       .query(({ input }) => getWebhookEvent(input.id)),
//     markProcessed: protectedProcedure
//       .input(z.object({ id: z.string(), error: z.string().optional() }))
//       // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       .mutation(({ input }) => markWebhookProcessed(input.id, input.error)),
//   },
// });

// export type WebhookRouter = typeof webhookRouter;
