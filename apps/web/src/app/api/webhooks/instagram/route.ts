import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@Zlo/db";
import { webhookEvent } from "@Zlo/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@Zlo/env/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const expectedSignature = `sha256=${crypto.createHmac("sha256", env.BETTER_AUTH_SECRET).update(body).digest("hex")}`;

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.object !== "instagram") {
    return NextResponse.json({ status: "ignored" });
  }

  const existing = await db.query.webhookEvent.findFirst({
    where: eq(webhookEvent.externalEventId, payload.entry?.[0]?.id ?? null),
  });

  if (existing) {
    return NextResponse.json({ status: "duplicate" });
  }

  await db.insert(webhookEvent).values({
    externalEventId: payload.entry?.[0]?.id,
    eventType: payload.entry?.[0]?.changes?.[0]?.field ?? "unknown",
    payload,
    status: "RECEIVED",
  });

  return NextResponse.json({ status: "received" });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.BETTER_AUTH_SECRET) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}
