import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { botsRouter } from "./routes/bots.js";
import { briefsRouter } from "./routes/briefs.js";
import { dashboardRouter } from "./routes/dashboard.js";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/bots", botsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
