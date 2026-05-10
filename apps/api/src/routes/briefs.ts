import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const briefsRouter: Router = Router();

briefsRouter.use(authMiddleware);

briefsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { topic, audience, weekOf } = req.body;

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    res.status(400).json({ error: "topic is required" });
    return;
  }
  if (!audience || typeof audience !== "string" || audience.trim().length === 0) {
    res.status(400).json({ error: "audience is required" });
    return;
  }
  if (!weekOf || typeof weekOf !== "string" || weekOf.trim().length === 0) {
    res.status(400).json({ error: "weekOf is required" });
    return;
  }

  const brief = await prisma.brief.create({
    data: {
      topic: topic.trim(),
      audience: audience.trim(),
      weekOf: weekOf.trim(),
      userId,
    },
  });

  res.status(201).json(brief);
});

briefsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const briefs = await prisma.brief.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(briefs);
});

briefsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);

  const brief = await prisma.brief.findUnique({ where: { id } });

  if (!brief) {
    res.status(404).json({ error: "Brief not found" });
    return;
  }

  if (brief.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  res.json(brief);
});

briefsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);

  const existing = await prisma.brief.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Brief not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const { topic, audience, weekOf } = req.body;
  const data: Record<string, string> = {};
  if (topic !== undefined && typeof topic === "string" && topic.trim().length > 0) {
    data.topic = topic.trim();
  }
  if (audience !== undefined && typeof audience === "string" && audience.trim().length > 0) {
    data.audience = audience.trim();
  }
  if (weekOf !== undefined && typeof weekOf === "string" && weekOf.trim().length > 0) {
    data.weekOf = weekOf.trim();
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "At least one field (topic, audience, weekOf) is required" });
    return;
  }

  const brief = await prisma.brief.update({
    where: { id },
    data,
  });

  res.json(brief);
});

briefsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);

  const existing = await prisma.brief.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Brief not found" });
    return;
  }
  if (existing.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.brief.delete({ where: { id } });
  res.status(204).send();
});
