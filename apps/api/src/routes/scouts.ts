import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const scoutsRouter: Router = Router();

scoutsRouter.use(authMiddleware);

scoutsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const scouts = await prisma.scout.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(scouts);
});

scoutsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const scout = await prisma.scout.findFirst({
    where: { id, userId: req.userId },
  });
  if (!scout) {
    res.status(404).json({ error: "Scout not found" });
    return;
  }
  res.json(scout);
});

scoutsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const { industry, region, signals } = req.body;

  if (!industry || !region) {
    res.status(400).json({ error: "industry and region are required" });
    return;
  }

  const scout = await prisma.scout.create({
    data: {
      userId: req.userId!,
      industry,
      region,
      signals: Array.isArray(signals) ? JSON.stringify(signals) : "[]",
    },
  });

  res.status(201).json(scout);
});

scoutsRouter.put("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = await prisma.scout.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Scout not found" });
    return;
  }

  const { industry, region, signals } = req.body;

  if (!industry || !region) {
    res.status(400).json({ error: "industry and region are required" });
    return;
  }

  const scout = await prisma.scout.update({
    where: { id },
    data: {
      industry,
      region,
      signals: Array.isArray(signals) ? JSON.stringify(signals) : existing.signals,
    },
  });

  res.json(scout);
});

scoutsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = await prisma.scout.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Scout not found" });
    return;
  }

  await prisma.scout.delete({ where: { id } });
  res.status(204).send();
});
