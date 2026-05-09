import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const webhooksRouter = Router();

webhooksRouter.use(authMiddleware);

const VALID_EVENTS = ["commentPlan", "dmBook", "bylineship"];

webhooksRouter.post("/", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { label, url, secret, events } = req.body;

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    res.status(400).json({ error: "label is required" });
    return;
  }
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    res.status(400).json({ error: "url must be a valid URL" });
    return;
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    res.status(400).json({ error: "url must use http or https" });
    return;
  }

  if (secret !== undefined && typeof secret !== "string") {
    res.status(400).json({ error: "secret must be a string" });
    return;
  }

  let eventList: string[] = [];
  if (events !== undefined) {
    if (!Array.isArray(events) || !events.every((e: unknown) => typeof e === "string")) {
      res.status(400).json({ error: "events must be an array of strings" });
      return;
    }
    const invalid = events.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalid.length > 0) {
      res.status(400).json({ error: `invalid events: ${invalid.join(", ")}` });
      return;
    }
    eventList = events;
  }

  const config = await prisma.webhookConfig.create({
    data: {
      userId,
      label: label.trim(),
      url: url.trim(),
      secret: secret ?? "",
      events: JSON.stringify(eventList),
      isActive: true,
    },
  });

  res.status(201).json(config);
});

webhooksRouter.get("/", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const configs = await prisma.webhookConfig.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  res.json(configs);
});

webhooksRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const config = await prisma.webhookConfig.findUnique({ where: { id } });

  if (!config) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  if (config.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  res.json(config);
});

webhooksRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.webhookConfig.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { label, url, secret, events, isActive } = req.body;
  const data: Record<string, unknown> = {};

  if (label !== undefined) {
    if (typeof label !== "string" || label.trim().length === 0) {
      res.status(400).json({ error: "label must be a non-empty string" });
      return;
    }
    data.label = label.trim();
  }

  if (url !== undefined) {
    if (typeof url !== "string" || url.trim().length === 0) {
      res.status(400).json({ error: "url must be a non-empty string" });
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      res.status(400).json({ error: "url must be a valid URL" });
      return;
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      res.status(400).json({ error: "url must use http or https" });
      return;
    }
    data.url = url.trim();
  }

  if (secret !== undefined) {
    if (typeof secret !== "string") {
      res.status(400).json({ error: "secret must be a string" });
      return;
    }
    data.secret = secret;
  }

  if (events !== undefined) {
    if (!Array.isArray(events) || !events.every((e: unknown) => typeof e === "string")) {
      res.status(400).json({ error: "events must be an array of strings" });
      return;
    }
    const invalid = events.filter((e: string) => !VALID_EVENTS.includes(e));
    if (invalid.length > 0) {
      res.status(400).json({ error: `invalid events: ${invalid.join(", ")}` });
      return;
    }
    data.events = JSON.stringify(events);
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      res.status(400).json({ error: "isActive must be a boolean" });
      return;
    }
    data.isActive = isActive;
  }

  const updated = await prisma.webhookConfig.update({
    where: { id },
    data,
  });

  res.json(updated);
});

webhooksRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.webhookConfig.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.webhookConfig.delete({ where: { id } });

  res.status(204).send();
});

webhooksRouter.get("/:id/deliveries", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const config = await prisma.webhookConfig.findUnique({ where: { id } });

  if (!config) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  if (config.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookConfigId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json(deliveries);
});
