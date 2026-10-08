import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@Zlo/db";
import * as schema from "@Zlo/db/schema/index";
import {
  decryptInstagramToken,
  encryptInstagramToken,
} from "@Zlo/db/server/crypto";

const { instagramAccount, instagramMedia, instagramComment, instagramMessage } = schema;

export async function listInstagramAccounts(userId: string) {
  return db.query.instagramAccount.findMany({
    where: eq(instagramAccount.userId, userId),
    orderBy: [desc(instagramAccount.createdAt)],
  });
}

export async function getInstagramAccount(userId: string, id: string) {
  const account = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.id, id),
      eq(instagramAccount.userId, userId),
    ),
    with: {
      media: {
        orderBy: [desc(instagramMedia.createdAt)],
      },
      messages: {
        orderBy: [desc(instagramMessage.createdAt)],
      },
    },
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  return account;
}

export async function createInstagramAccount(userId: string, data: {
  instagramId: string;
  username: string;
  profilePicture?: string;
  accessToken: string;
  accessTokenExpiresAt?: Date;
}) {
  const existing = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.userId, userId),
      eq(instagramAccount.instagramId, data.instagramId),
    ),
  });

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Instagram account already connected",
    });
  }

  const encryptedToken = encryptInstagramToken(data.accessToken);

  return db.insert(instagramAccount).values({
    userId,
    instagramId: data.instagramId,
    username: data.username,
    profilePicture: data.profilePicture,
    accessTokenEncrypted: encryptedToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt,
  }).returning();
}

export async function updateInstagramAccount(
  userId: string,
  id: string,
  data: {
    username?: string;
    profilePicture?: string;
    accessToken?: string;
    accessTokenExpiresAt?: Date;
    isActive?: boolean;
  },
) {
  const account = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.id, id),
      eq(instagramAccount.userId, userId),
    ),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  const values: Record<string, unknown> = {};
  if (data.username !== undefined) values.username = data.username;
  if (data.profilePicture !== undefined) values.profilePicture = data.profilePicture;
  if (data.isActive !== undefined) values.isActive = data.isActive;
  if (data.accessToken !== undefined) {
    values.accessTokenEncrypted = encryptInstagramToken(data.accessToken);
  }
  if (data.accessTokenExpiresAt !== undefined) {
    values.accessTokenExpiresAt = data.accessTokenExpiresAt;
  }

  return db.update(instagramAccount).set(values).where(eq(instagramAccount.id, id)).returning();
}

export async function deleteInstagramAccount(userId: string, id: string) {
  const account = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.id, id),
      eq(instagramAccount.userId, userId),
    ),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  return db.delete(instagramAccount).where(eq(instagramAccount.id, id));
}

export async function getAccessToken(accountId: string): Promise<string> {
  const account = await db.query.instagramAccount.findFirst({
    where: eq(instagramAccount.id, accountId),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  return decryptInstagramToken(account.accessTokenEncrypted);
}

export async function listMedia(accountId: string, userId: string, limit = 20, cursor?: string) {
  const account = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.id, accountId),
      eq(instagramAccount.userId, userId),
    ),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  const conditions = [eq(instagramMedia.instagramAccountId, accountId)];
  if (cursor) {
    conditions.push(eq(instagramMedia.createdAt, new Date(cursor)));
  }

  const media = await db.query.instagramMedia.findMany({
    where: and(...conditions),
    orderBy: [desc(instagramMedia.createdAt)],
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (media.length > limit) {
    const next = media.pop();
    nextCursor = next!.createdAt.toISOString();
  }

  return { media, nextCursor };
}

export async function listComments(
  mediaId: string,
  userId: string,
  limit = 20,
  cursor?: string,
) {
  const media = await db.query.instagramMedia.findFirst({
    where: eq(instagramMedia.id, mediaId),
    with: {
      account: true,
    },
  });

  if (!media || media.account.userId !== userId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Media not found",
    });
  }

  const conditions = [eq(instagramComment.mediaId, mediaId)];
  if (cursor) {
    conditions.push(eq(instagramComment.createdAt, new Date(cursor)));
  }

  const comments = await db.query.instagramComment.findMany({
    where: and(...conditions),
    orderBy: [desc(instagramComment.createdAt)],
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (comments.length > limit) {
    const next = comments.pop();
    nextCursor = next!.createdAt.toISOString();
  }

  return { comments, nextCursor };
}

export async function listMessages(
  accountId: string,
  userId: string,
  limit = 50,
  cursor?: string,
) {
  const account = await db.query.instagramAccount.findFirst({
    where: and(
      eq(instagramAccount.id, accountId),
      eq(instagramAccount.userId, userId),
    ),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Instagram account not found",
    });
  }

  const conditions = [eq(instagramMessage.instagramAccountId, accountId)];
  if (cursor) {
    conditions.push(eq(instagramMessage.createdAt, new Date(cursor)));
  }

  const messages = await db.query.instagramMessage.findMany({
    where: and(...conditions),
    orderBy: [desc(instagramMessage.createdAt)],
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (messages.length > limit) {
    const next = messages.pop();
    nextCursor = next!.createdAt.toISOString();
  }

  return { messages, nextCursor };
}
