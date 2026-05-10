import * as assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  deliverWebhookWithStore,
  processRetriesWithStore,
  triggerWebhooksWithStore,
} from "../../apps/api/src/lib/webhooks.ts";

type Config = {
  id: string;
  userId: string;
  label: string;
  url: string;
  secret: string;
  events: string;
  isActive: boolean;
};

type Delivery = {
  id: string;
  webhookConfigId: string;
  eventType: string;
  status: string;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  payload: string;
  attemptLog: string;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  durationMs: number | null;
  lastAttemptAt: Date | null;
  webhookConfig?: Config;
};

function makeStore(delivery: Delivery, config: Config) {
  const created: Delivery[] = [];
  return {
    created,
    updates: [] as Delivery[],
    store: {
      webhookConfig: {
        async findMany() {
          return [config];
        },
      },
      webhookDelivery: {
        async create(args: { data: Partial<Delivery> }) {
          const nextDelivery = { ...delivery, ...args.data };
          created.push(nextDelivery);
          return nextDelivery;
        },
        async findUnique() {
          return { ...delivery, webhookConfig: config };
        },
        async findMany() {
          return [delivery];
        },
        async update(args: { data: Partial<Delivery> }) {
          Object.assign(delivery, args.data);
          this.updates?.push?.({ ...delivery });
          return delivery;
        },
      },
    },
  };
}

afterEach(() => {
  delete process.env.TZ;
});

test("deliverWebhookWithStore persists success and writes an audit attempt", async () => {
  const config: Config = {
    id: "cfg_1",
    userId: "user_1",
    label: "CRM",
    url: "https://crm.example.test/hooks",
    secret: "shared-secret",
    events: "[\"commentPlan\",\"dmBook\"]",
    isActive: true,
  };
  const delivery: Delivery = {
    id: "del_1",
    webhookConfigId: config.id,
    eventType: "dmBook",
    status: "pending",
    attempt: 0,
    maxAttempts: 5,
    nextRetryAt: null,
    payload: JSON.stringify({ lead: { email: "buyer@example.com" } }),
    attemptLog: "[]",
    responseStatus: null,
    responseBody: null,
    error: null,
    durationMs: null,
    lastAttemptAt: null,
  };
  const { store } = makeStore(delivery, config);
  let capturedHeaders: Headers;

  await deliverWebhookWithStore(store, async (_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return new Response("created", { status: 201 });
  }, delivery.id);

  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.attempt, 1);
  assert.equal(delivery.responseStatus, 201);
  assert.equal(delivery.responseBody, "created");
  assert.equal(delivery.error, null);
  assert.equal(delivery.nextRetryAt, null);
  assert.equal(capturedHeaders!.get("X-Brassmark-Event"), "dmBook");
  assert.ok(capturedHeaders!.get("X-Brassmark-Signature"));
  assert.deepEqual(JSON.parse(delivery.attemptLog).map((a: { status: string }) => a.status), [
    "delivered",
  ]);
});

test("deliverWebhookWithStore schedules exponential retries and caps at max attempts", async () => {
  const config: Config = {
    id: "cfg_2",
    userId: "user_1",
    label: "CRM",
    url: "https://crm.example.test/hooks",
    secret: "",
    events: "[\"commentPlan\"]",
    isActive: true,
  };
  const delivery: Delivery = {
    id: "del_2",
    webhookConfigId: config.id,
    eventType: "commentPlan",
    status: "failed",
    attempt: 4,
    maxAttempts: 5,
    nextRetryAt: new Date(Date.now() - 1000),
    payload: "{}",
    attemptLog: JSON.stringify([{ attempt: 4, status: "retry_scheduled" }]),
    responseStatus: null,
    responseBody: null,
    error: null,
    durationMs: null,
    lastAttemptAt: null,
  };
  const { store } = makeStore(delivery, config);

  await deliverWebhookWithStore(store, async () => {
    return new Response("unavailable", { status: 503 });
  }, delivery.id);

  assert.equal(delivery.status, "failed");
  assert.equal(delivery.attempt, 5);
  assert.equal(delivery.responseStatus, 503);
  assert.equal(delivery.error, "HTTP 503");
  assert.equal(delivery.nextRetryAt, null);
  assert.deepEqual(JSON.parse(delivery.attemptLog).map((a: { status: string }) => a.status), [
    "retry_scheduled",
    "failed",
  ]);
});

test("processRetriesWithStore sends only due retry candidates", async () => {
  const config: Config = {
    id: "cfg_3",
    userId: "user_1",
    label: "CRM",
    url: "https://crm.example.test/hooks",
    secret: "",
    events: "[]",
    isActive: true,
  };
  const delivery: Delivery = {
    id: "del_3",
    webhookConfigId: config.id,
    eventType: "dmBook",
    status: "failed",
    attempt: 1,
    maxAttempts: 5,
    nextRetryAt: new Date(Date.now() - 1000),
    payload: "{}",
    attemptLog: "[]",
    responseStatus: null,
    responseBody: null,
    error: null,
    durationMs: null,
    lastAttemptAt: null,
  };
  const { store } = makeStore(delivery, config);
  let calls = 0;

  const processed = await processRetriesWithStore(store, async () => {
    calls += 1;
    return new Response(null, { status: 204 });
  });

  assert.equal(processed, 1);
  assert.equal(calls, 1);
  assert.equal(delivery.status, "delivered");
  assert.equal(delivery.attempt, 2);
});

test("triggerWebhooksWithStore enqueues matching commentPlan and dmBook deliveries", async () => {
  const config: Config = {
    id: "cfg_4",
    userId: "user_1",
    label: "CRM",
    url: "https://crm.example.test/hooks",
    secret: "",
    events: "[\"commentPlan\",\"dmBook\"]",
    isActive: true,
  };
  const delivery: Delivery = {
    id: "del_4",
    webhookConfigId: config.id,
    eventType: "commentPlan",
    status: "pending",
    attempt: 0,
    maxAttempts: 5,
    nextRetryAt: null,
    payload: "{}",
    attemptLog: "[]",
    responseStatus: null,
    responseBody: null,
    error: null,
    durationMs: null,
    lastAttemptAt: null,
  };
  const { store, created } = makeStore(delivery, config);
  let calls = 0;

  await triggerWebhooksWithStore(
    store,
    async () => {
      calls += 1;
      return new Response(null, { status: 202 });
    },
    "user_1",
    "commentPlan",
    { lead: { email: "lead@example.com" } }
  );

  assert.equal(calls, 1);
  assert.equal(created.length, 1);
  assert.equal(created[0].eventType, "commentPlan");
  assert.equal(created[0].maxAttempts, 5);
  assert.deepEqual(JSON.parse(created[0].payload), {
    lead: { email: "lead@example.com" },
  });
});
