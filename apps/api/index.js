const express = require("express");

const app = express();
const PORT = process.env.PORT || 3002;

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`api listening on port ${PORT}`);
});
