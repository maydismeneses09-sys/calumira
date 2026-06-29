require("dotenv").config();

const express = require("express");
const cors = require("cors");
const tarotRoutes = require("./routes/tarot");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tarot", tarotRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`Umbral Arcano backend escuchando en puerto ${PORT}`);
});