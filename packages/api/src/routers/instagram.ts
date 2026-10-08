import { z } from "zod";
import { router, protectedProcedure } from "../index";
import {
  createInstagramAccount,
  deleteInstagramAccount,
  getInstagramAccount,
  listInstagramAccounts,
  updateInstagramAccount,
  listMedia,
  listComments,
  listMessages,
} from "../server/services/instagram";

export const instagramRouter = router({
  accounts: {
    list: protectedProcedure.query(({ ctx }) =>
      listInstagramAccounts(ctx.session.user.id),
    ),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ ctx, input }) =>
        getInstagramAccount(ctx.session.user.id, input.id),
      ),
    create: protectedProcedure
      .input(
        z.object({
          instagramId: z.string().min(1),
          username: z.string().min(1).max(255),
          profilePicture: z.string().url().optional(),
          accessToken: z.string().min(1),
          accessTokenExpiresAt: z.coerce.date().optional(),
        }),
      )
      .mutation(({ ctx, input }) =>
        createInstagramAccount(ctx.session.user.id, input),
      ),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          username: z.string().min(1).max(255).optional(),
          profilePicture: z.string().url().optional(),
          accessToken: z.string().min(1).optional(),
          accessTokenExpiresAt: z.coerce.date().optional(),
          isActive: z.boolean().optional(),
        }),
      )
      .mutation(({ ctx, input }) => {
        const { id, ...rest } = input;
        return updateInstagramAccount(ctx.session.user.id, id, rest);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ ctx, input }) =>
        deleteInstagramAccount(ctx.session.user.id, input.id),
      ),
  },
  media: {
    list: protectedProcedure
      .input(
        z.object({
          accountId: z.string(),
          limit: z.number().int().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) =>
        listMedia(input.accountId, ctx.session.user.id, input.limit, input.cursor),
      ),
  },
  comments: {
    list: protectedProcedure
      .input(
        z.object({
          mediaId: z.string(),
          limit: z.number().int().min(1).max(50).default(20),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) =>
        listComments(input.mediaId, ctx.session.user.id, input.limit, input.cursor),
      ),
  },
  messages: {
    list: protectedProcedure
      .input(
        z.object({
          accountId: z.string(),
          limit: z.number().int().min(1).max(100).default(50),
          cursor: z.string().optional(),
        }),
      )
      .query(({ ctx, input }) =>
        listMessages(input.accountId, ctx.session.user.id, input.limit, input.cursor),
      ),
  },
});

export type InstagramRouter = typeof instagramRouter;
