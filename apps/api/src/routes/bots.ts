import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const botsRouter = Router();

botsRouter.use(authMiddleware);

const createBotSchema = z.object({
  name: z.string().min(1, "Name is required"),
  systemPrompt: z.string().optional().default(""),
  businessHours: z.string().optional().default(""),
  greeting: z.string().optional().default(""),
  fallback: z.string().optional().default(""),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #4F46E5")
    .optional()
    .default("#4F46E5"),
});

botsRouter.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = createBotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors });
    return;
  }

  const bot = await prisma.bot.create({
    data: {
      ...parsed.data,
      userId: req.userId!,
    },
  });

  res.status(201).json(bot);
});

botsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const bots = await prisma.bot.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });

  res.json(bots);
});

botsRouter.get("/:id", async (req: AuthRequest, res: Response) => {
  const bot = await prisma.bot.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json(bot);
});
