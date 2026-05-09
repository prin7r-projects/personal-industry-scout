import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const briefsRouter = Router();

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

briefsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

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
