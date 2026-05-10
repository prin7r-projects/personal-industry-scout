import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { botsRouter } from "./routes/bots.js";
import { briefsRouter } from "./routes/briefs.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { scoutsRouter } from "./routes/scouts.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { startWebhookRetryWorker } from "./lib/webhooks.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/bots", botsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/scouts", scoutsRouter);
app.use("/api/webhooks", webhooksRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

if (process.env.WEBHOOK_RETRY_WORKER_DISABLED !== "1") {
  startWebhookRetryWorker();
}
