import { createHmac } from "node:crypto";
import { prisma } from "@brassmark/db";

const MAX_RETRY_DELAY_MS = 60_000;

function computeNextRetry(attempt: number): Date {
  const delayMs = Math.min(2 ** attempt * 1000, MAX_RETRY_DELAY_MS);
  return new Date(Date.now() + delayMs);
}

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliverWebhook(deliveryId: string): Promise<void> {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhookConfig: true },
  });

  if (!delivery) return;

  const { webhookConfig } = delivery;
  const payload = delivery.payload;
  const startedAt = Date.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Brassmark-Event": delivery.eventType,
    "X-Brassmark-Delivery-Id": delivery.id,
  };

  if (webhookConfig.secret) {
    headers["X-Brassmark-Signature"] = signPayload(webhookConfig.secret, payload);
  }

  const nextAttempt = delivery.attempt + 1;

  try {
    const response = await fetch(webhookConfig.url, {
      method: "POST",
      headers,
      body: payload,
    });

    const durationMs = Date.now() - startedAt;
    let responseBody: string | null = null;
    try {
      responseBody = await response.text();
      if (responseBody.length > 4000) {
        responseBody = responseBody.slice(0, 4000);
      }
    } catch {
      responseBody = null;
    }

    if (response.ok) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "delivered",
          attempt: nextAttempt,
          responseStatus: response.status,
          responseBody,
          durationMs,
          error: null,
          nextRetryAt: null,
        },
      });
    } else {
      if (nextAttempt >= delivery.maxAttempts) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            attempt: nextAttempt,
            responseStatus: response.status,
            responseBody,
            durationMs,
            error: `HTTP ${response.status}`,
            nextRetryAt: null,
          },
        });
      } else {
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            attempt: nextAttempt,
            responseStatus: response.status,
            responseBody,
            durationMs,
            error: `HTTP ${response.status}`,
            nextRetryAt: computeNextRetry(nextAttempt),
          },
        });
      }
    }
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (nextAttempt >= delivery.maxAttempts) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          attempt: nextAttempt,
          durationMs,
          error: errorMessage.slice(0, 2000),
          nextRetryAt: null,
        },
      });
    } else {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          attempt: nextAttempt,
          durationMs,
          error: errorMessage.slice(0, 2000),
          nextRetryAt: computeNextRetry(nextAttempt),
        },
      });
    }
  }
}

export async function triggerWebhooks(
  userId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const configs = await prisma.webhookConfig.findMany({
    where: { userId, isActive: true },
  });

  const matchingConfigs = configs.filter((c) => {
    try {
      const events: string[] = JSON.parse(c.events);
      return events.length === 0 || events.includes(eventType);
    } catch {
      return false;
    }
  });

  const payloadStr = JSON.stringify(payload);

  for (const config of matchingConfigs) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookConfigId: config.id,
        eventType,
        status: "pending",
        attempt: 0,
        maxAttempts: 5,
        payload: payloadStr,
      },
    });

    deliverWebhook(delivery.id).catch((err) => {
      console.error(`Webhook delivery ${delivery.id} failed unexpectedly:`, err);
    });
  }
}

export async function processRetries(): Promise<number> {
  const now = new Date();

  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      attempt: { lt: prisma.webhookDelivery.fields.maxAttempts ?? 5 },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    take: 50,
  });

  for (const delivery of pending) {
    await deliverWebhook(delivery.id);
  }

  return pending.length;
}

const MAX_RETRY_DELAY_MS_REF: number = MAX_RETRY_DELAY_MS;
export { MAX_RETRY_DELAY_MS_REF };
