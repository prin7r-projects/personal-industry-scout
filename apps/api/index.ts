import express, { Request, Response, NextFunction } from "express";
import { prisma } from "@pis/db";

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(express.json());

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

interface ScoutPayload {
  industry?: unknown;
  region?: unknown;
  signals?: unknown;
}

function normalizeScoutPayload(body: ScoutPayload | undefined) {
  const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
  const region = typeof body?.region === "string" ? body.region.trim() : "";

  if (!industry || !region || !Array.isArray(body?.signals)) {
    return null;
  }

  const signals = body.signals.map((signal: unknown) =>
    typeof signal === "string" ? signal.trim() : signal
  );

  if (!signals.every((signal: unknown) => isNonEmptyString(signal))) {
    return null;
  }

  return { industry, region, signals: signals as string[] };
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

async function authenticateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const configuredKey = process.env.CUSTOMER_API_KEY;
    const authHeader = req.get("authorization") || "";
    const userId = req.get("x-user-id");

    if (!configuredKey) {
      return sendError(res, 503, "Customer API authentication is not configured.");
    }

    if (authHeader !== `Bearer ${configuredKey}`) {
      return sendError(res, 401, "Unauthorized.");
    }

    if (!isNonEmptyString(userId) || !isUuid(userId)) {
      return sendError(res, 401, "Unauthorized.");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(res, 401, "Unauthorized.");
    }

    req.user = { id: user.id };
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    endpoints: ["/health", "/api/scouts"],
  });
});

app.get("/api/scouts", authenticateCustomer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scouts = await prisma.scoutConfig.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ scouts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/scouts", authenticateCustomer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = normalizeScoutPayload(req.body);
    if (!payload) {
      return sendError(res, 400, "industry, region, and signals[] are required.");
    }

    const scout = await prisma.scoutConfig.create({
      data: {
        userId: req.user!.id,
        industry: payload.industry,
        region: payload.region,
        signals: payload.signals,
      },
    });

    return res.status(201).json({ scout });
  } catch (error) {
    return next(error);
  }
});

async function updateScoutConfig(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isUuid(req.params.id)) {
      return sendError(res, 404, "Scout config not found.");
    }

    const payload = normalizeScoutPayload(req.body);
    if (!payload) {
      return sendError(res, 400, "industry, region, and signals[] are required.");
    }

    const existing = await prisma.scoutConfig.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!existing) {
      return sendError(res, 404, "Scout config not found.");
    }

    const scout = await prisma.scoutConfig.update({
      where: { id: existing.id },
      data: {
        industry: payload.industry,
        region: payload.region,
        signals: payload.signals,
      },
    });

    return res.json({ scout });
  } catch (error) {
    return next(error);
  }
}

app.put("/api/scouts/:id", authenticateCustomer, updateScoutConfig);
app.patch("/api/scouts/:id", authenticateCustomer, updateScoutConfig);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  return sendError(res, 500, "Internal server error.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`api listening on port ${PORT}`);
});
