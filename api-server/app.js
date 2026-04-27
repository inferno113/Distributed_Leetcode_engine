import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRouter from "./routes/health.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "API server is running" });
});

app.use("/api/health", healthRouter);

export default app;
