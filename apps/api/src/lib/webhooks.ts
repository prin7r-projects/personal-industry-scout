import { createHmac } from "node:crypto";
import { prisma } from "@brassmark/db";

const MAX_RETRY_DELAY_MS = 60_000;
const MAX_RESPONSE_BODY_CHARS = 4000;
const MAX_ERROR_CHARS = 2000;

type WebhookConfigRecord = {
  id: string;
  userId: string;
  label: string;
  url: string;
  secret: string;
  events: string;
  isActive: boolean;
};

type WebhookDeliveryRecord = {
  id: string;
  webhookConfigId: string;
  eventType: string;
  status: string;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  payload: string;
  attemptLog?: string | null;
  responseStatus?: number | null;
  responseBody?: string | null;
  error?: string | null;
  durationMs?: number | null;
  lastAttemptAt?: Date | null;
  webhookConfig?: WebhookConfigRecord;
};

type DeliveryUpdate = {
  status: string;
  attempt: number;
  responseStatus?: number | null;
  responseBody?: string | null;
  durationMs: number;
  error: string | null;
  nextRetryAt: Date | null;
  attemptLog: string;
  lastAttemptAt: Date;
};

type WebhookStore = {
  webhookConfig: {
    findMany(args: {
      where: { userId: string; isActive: boolean };
    }): Promise<WebhookConfigRecord[]>;
  };
  webhookDelivery: {
    create(args: {
      data: {
        webhookConfigId: string;
        eventType: string;
        status: string;
        attempt: number;
        maxAttempts: number;
        payload: string;
      };
    }): Promise<WebhookDeliveryRecord>;
    findUnique(args: {
      where: { id: string };
      include: { webhookConfig: boolean };
    }): Promise<WebhookDeliveryRecord | null>;
    findMany(args: {
      where: {
        status: { in: string[] };
        attempt: { lt: number };
        OR: Array<{ nextRetryAt: null } | { nextRetryAt: { lte: Date } }>;
      };
      take: number;
    }): Promise<WebhookDeliveryRecord[]>;
    update(args: {
      where: { id: string };
      data: DeliveryUpdate;
    }): Promise<WebhookDeliveryRecord>;
  };
};

type Fetcher = typeof fetch;

function computeNextRetry(attempt: number): Date {
  const delayMs = Math.min(2 ** attempt * 1000, MAX_RETRY_DELAY_MS);
  return new Date(Date.now() + delayMs);
}

function signPayload(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function parseAttemptLog(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendAttemptLog(
  delivery: WebhookDeliveryRecord,
  entry: Record<string, unknown>
): string {
  return JSON.stringify([...parseAttemptLog(delivery.attemptLog), entry]);
}

async function deliverWebhookWithStore(
  store: WebhookStore,
  fetcher: Fetcher,
  deliveryId: string
): Promise<void> {
  const delivery = await store.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhookConfig: true },
  });

  if (!delivery || !delivery.webhookConfig) return;

  const { webhookConfig } = delivery;
  const payload = delivery.payload;
  const startedAt = Date.now();
  const lastAttemptAt = new Date();

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
    const response = await fetcher(webhookConfig.url, {
      method: "POST",
      headers,
      body: payload,
    });

    const durationMs = Date.now() - startedAt;
    let responseBody: string | null = null;
    try {
      responseBody = await response.text();
      if (responseBody.length > MAX_RESPONSE_BODY_CHARS) {
        responseBody = responseBody.slice(0, MAX_RESPONSE_BODY_CHARS);
      }
    } catch {
      responseBody = null;
    }

    if (response.ok) {
      const attemptLog = appendAttemptLog(delivery, {
        attempt: nextAttempt,
        status: "delivered",
        responseStatus: response.status,
        durationMs,
        at: lastAttemptAt.toISOString(),
      });
      await store.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "delivered",
          attempt: nextAttempt,
          responseStatus: response.status,
          responseBody,
          durationMs,
          error: null,
          nextRetryAt: null,
          attemptLog,
          lastAttemptAt,
        },
      });
      console.log(
        `[webhook] delivered deliveryId=${delivery.id} event=${delivery.eventType} status=${response.status} attempt=${nextAttempt}`
      );
    } else {
      const exhausted = nextAttempt >= delivery.maxAttempts;
      const attemptLog = appendAttemptLog(delivery, {
        attempt: nextAttempt,
        status: exhausted ? "failed" : "retry_scheduled",
        responseStatus: response.status,
        durationMs,
        error: `HTTP ${response.status}`,
        at: lastAttemptAt.toISOString(),
      });
      if (nextAttempt >= delivery.maxAttempts) {
        await store.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            attempt: nextAttempt,
            responseStatus: response.status,
            responseBody,
            durationMs,
            error: `HTTP ${response.status}`,
            nextRetryAt: null,
            attemptLog,
            lastAttemptAt,
          },
        });
      } else {
        await store.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            attempt: nextAttempt,
            responseStatus: response.status,
            responseBody,
            durationMs,
            error: `HTTP ${response.status}`,
            nextRetryAt: computeNextRetry(nextAttempt),
            attemptLog,
            lastAttemptAt,
          },
        });
      }
    }
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const exhausted = nextAttempt >= delivery.maxAttempts;
    const attemptLog = appendAttemptLog(delivery, {
      attempt: nextAttempt,
      status: exhausted ? "failed" : "retry_scheduled",
      durationMs,
      error: errorMessage.slice(0, MAX_ERROR_CHARS),
      at: lastAttemptAt.toISOString(),
    });

    if (nextAttempt >= delivery.maxAttempts) {
      await store.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          attempt: nextAttempt,
          durationMs,
          error: errorMessage.slice(0, MAX_ERROR_CHARS),
          nextRetryAt: null,
          attemptLog,
          lastAttemptAt,
        },
      });
    } else {
      await store.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "failed",
          attempt: nextAttempt,
          durationMs,
          error: errorMessage.slice(0, MAX_ERROR_CHARS),
          nextRetryAt: computeNextRetry(nextAttempt),
          attemptLog,
          lastAttemptAt,
        },
      });
    }
  }
}

export async function deliverWebhook(deliveryId: string): Promise<void> {
  await deliverWebhookWithStore(prisma, fetch, deliveryId);
}

async function triggerWebhooksWithStore(
  store: WebhookStore,
  fetcher: Fetcher,
  userId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const configs = await store.webhookConfig.findMany({
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
    const delivery = await store.webhookDelivery.create({
      data: {
        webhookConfigId: config.id,
        eventType,
        status: "pending",
        attempt: 0,
        maxAttempts: 5,
        payload: payloadStr,
      },
    });

    deliverWebhookWithStore(store, fetcher, delivery.id).catch((err) => {
      console.error(`Webhook delivery ${delivery.id} failed unexpectedly:`, err);
    });
  }
}

export async function triggerWebhooks(
  userId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  await triggerWebhooksWithStore(prisma, fetch, userId, eventType, payload);
}

async function processRetriesWithStore(
  store: WebhookStore,
  fetcher: Fetcher
): Promise<number> {
  const now = new Date();

  const pending = await store.webhookDelivery.findMany({
    where: {
      status: { in: ["pending", "failed"] },
      attempt: { lt: 5 },
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    take: 50,
  });

  for (const delivery of pending) {
    await deliverWebhookWithStore(store, fetcher, delivery.id);
  }

  return pending.length;
}

export async function processRetries(): Promise<number> {
  return processRetriesWithStore(prisma, fetch);
}

export function startWebhookRetryWorker(intervalMs = 30_000): ReturnType<typeof setInterval> {
  return setInterval(() => {
    processRetries().catch((err) => {
      console.error("[webhook] retry worker failed:", err);
    });
  }, intervalMs);
}

const MAX_RETRY_DELAY_MS_REF: number = MAX_RETRY_DELAY_MS;
export {
  MAX_RETRY_DELAY_MS_REF,
  computeNextRetry,
  deliverWebhookWithStore,
  processRetriesWithStore,
  triggerWebhooksWithStore,
};
