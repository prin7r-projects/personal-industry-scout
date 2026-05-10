const express = require("express");
const { prisma } = require("@pis/db");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeScoutPayload(body) {
  const industry = typeof body?.industry === "string" ? body.industry.trim() : "";
  const region = typeof body?.region === "string" ? body.region.trim() : "";

  if (!industry || !region || !Array.isArray(body?.signals)) {
    return null;
  }

  const signals = body.signals.map((signal) =>
    typeof signal === "string" ? signal.trim() : signal
  );

  if (!signals.every((signal) => isNonEmptyString(signal))) {
    return null;
  }

  return { industry, region, signals };
}

async function authenticateCustomer(req, res, next) {
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

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api", (_req, res) => {
  res.json({
    ok: true,
    endpoints: ["/health", "/api/scouts"],
  });
});

app.get("/api/scouts", authenticateCustomer, async (req, res, next) => {
  try {
    const scouts = await prisma.scoutConfig.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ scouts });
  } catch (error) {
    next(error);
  }
});

app.post("/api/scouts", authenticateCustomer, async (req, res, next) => {
  try {
    const payload = normalizeScoutPayload(req.body);
    if (!payload) {
      return sendError(res, 400, "industry, region, and signals[] are required.");
    }

    const scout = await prisma.scoutConfig.create({
      data: {
        userId: req.user.id,
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

async function updateScoutConfig(req, res, next) {
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
        userId: req.user.id,
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

app.use((error, _req, res, _next) => {
  console.error(error);
  return sendError(res, 500, "Internal server error.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`api listening on port ${PORT}`);
});
