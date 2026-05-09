import { Router, Response } from "express";
import { prisma } from "@brassmark/db";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware);

dashboardRouter.get("/metrics", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const [totalTenders, userWatches, userMatches, tendersByStatus, recentMatches] =
    await Promise.all([
      prisma.tender.count(),
      prisma.watch.count({ where: { userId } }),
      prisma.match.findMany({
        where: { userId },
        include: { tender: { select: { title: true, buyer: true, value: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.tender.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.match.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalMatches = userMatches.length;
  const avgScore =
    totalMatches > 0
      ? userMatches.reduce((sum, m) => sum + m.score, 0) / totalMatches
      : 0;
  const unseenMatches = userMatches.filter((m) => !m.seen).length;

  res.json({
    tenders: {
      total: totalTenders,
      byStatus: Object.fromEntries(
        tendersByStatus.map((g) => [g.status, g._count.id])
      ),
    },
    user: {
      watches: userWatches,
      matches: {
        total: totalMatches,
        unseen: unseenMatches,
        avgScore: Math.round(avgScore * 100) / 100,
        recent: recentMatches.map((m) => ({
          id: m.id,
          score: m.score,
          seen: m.seen,
          tender: {
            id: m.tenderId,
            title: m.tender.title,
            buyer: m.tender.buyer,
            value: m.tender.value,
          },
          createdAt: m.createdAt,
        })),
        top: userMatches.slice(0, 5).map((m) => ({
          id: m.id,
          score: m.score,
          tender: {
            id: m.tenderId,
            title: m.tender.title,
            buyer: m.tender.buyer,
            value: m.tender.value,
          },
        })),
      },
    },
  });
});
