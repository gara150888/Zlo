import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@Zlo/db";
import * as schema from "@Zlo/db/schema/index";
import { webhookEvent } from "@Zlo/db/schema/index";

export async function recordWebhookEvent(data: {
  externalEventId?: string;
  instagramAccountId?: string;
  eventType: string;
  payload: unknown;
  status?: "RECEIVED" | "PROCESSING" | "PROCESSED" | "FAILED";
  error?: string;
}) {
  return db.insert(webhookEvent).values({
    externalEventId: data.externalEventId,
    instagramAccountId: data.instagramAccountId,
    eventType: data.eventType,
    payload: data.payload as Record<string, unknown>,
    status: data.status ?? "RECEIVED",
    error: data.error,
    processedAt: data.status === "PROCESSED" || data.status === "FAILED" ? new Date() : null,
  }).returning();
}

export async function getWebhookEvent(id: string) {
  const event = await db.query.webhookEvent.findFirst({
    where: eq(webhookEvent.id, id),
    with: {
      account: true,
    },
  });

  if (!event) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Webhook event not found",
    });
  }

  return event;
}

export async function markWebhookProcessed(id: string, error?: string) {
  const event = await db.query.webhookEvent.findFirst({
    where: eq(webhookEvent.id, id),
  });

  if (!event) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Webhook event not found",
    });
  }

  return db
    .update(webhookEvent)
    .set({
      status: error ? "FAILED" : "PROCESSED",
      processedAt: new Date(),
      error,
    })
    .where(eq(webhookEvent.id, id))
    .returning();
}

export async function findExistingEvent(externalEventId: string) {
  return db.query.webhookEvent.findFirst({
    where: eq(webhookEvent.externalEventId, externalEventId),
  });
}

export async function listWebhookEvents(
  userId: string,
  limit = 20,
  cursor?: string,
) {
  const accountIds = await db
    .select({ id: schema.instagramAccount.id })
    .from(schema.instagramAccount)
    .where(eq(schema.instagramAccount.userId, userId));

  const accountIdValues = accountIds.map((a) => a.id);

  if (accountIdValues.length === 0) {
    return { events: [], nextCursor: undefined };
  }

  const conditions = [eq(webhookEvent.instagramAccountId, accountIdValues[0]!)];
  for (let i = 1; i < accountIdValues.length; i++) {
    conditions.push(eq(webhookEvent.instagramAccountId, accountIdValues[i]!));
  }

  if (cursor) {
    conditions.push(eq(webhookEvent.createdAt, new Date(cursor)));
  }

  const events = await db.query.webhookEvent.findMany({
    where: and(...conditions),
    orderBy: [desc(webhookEvent.createdAt)],
    limit: limit + 1,
  });

  let nextCursor: string | undefined;
  if (events.length > limit) {
    const next = events.pop();
    nextCursor = next!.createdAt.toISOString();
  }

  return { events, nextCursor };
}
