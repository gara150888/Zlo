import { eq, desc } from "drizzle-orm";
import { db } from "@Zlo/db";
import { subscription } from "@Zlo/db/schema/index";

export async function getSubscription(userId: string) {
  return db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: [desc(subscription.createdAt)],
  });
}

export async function upsertSubscription(
  userId: string,
  data: {
    plan: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  },
) {
  const existing = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
  });

  if (existing) {
    return db
      .update(subscription)
      .set({
        plan: data.plan as "FREE" | "PRO" | "ENTERPRISE",
        status: data.status as "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE" | "UNPAID",
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      })
      .where(eq(subscription.userId, userId))
      .returning();
  }

  return db.insert(subscription).values({
    userId,
    plan: data.plan as "FREE" | "PRO" | "ENTERPRISE",
    status: data.status as "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE" | "UNPAID",
    currentPeriodStart: data.currentPeriodStart,
    currentPeriodEnd: data.currentPeriodEnd,
  }).returning();
}
