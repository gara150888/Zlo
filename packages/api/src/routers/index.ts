import { createTask, deleteTask, listTasks, setTaskCompleted } from "@Zlo/db/tasks";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  tasks: router({
    list: protectedProcedure.query(({ ctx }) => listTasks(ctx.session.user.id)),
    create: protectedProcedure
      .input(z.object({ title: z.string().trim().min(1).max(255) }))
      .mutation(({ ctx, input }) => createTask(ctx.session.user.id, input.title)),
    setCompleted: protectedProcedure
      .input(z.object({ id: z.number().int(), completed: z.boolean() }))
      .mutation(({ ctx, input }) =>
        setTaskCompleted(ctx.session.user.id, input.id, input.completed),
      ),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ ctx, input }) => deleteTask(ctx.session.user.id, input.id)),
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
});
export type AppRouter = typeof appRouter;
