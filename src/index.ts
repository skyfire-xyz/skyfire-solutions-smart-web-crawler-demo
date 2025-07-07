import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectRedis, disconnectRedis } from "./config/redis";
import { createCachedProxyMiddleware } from "./middleware/proxy";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(
  "/",
  createCachedProxyMiddleware({
    target:
      process.env.PROXY_TARGET || "https://demo-real-estate-prv4.onrender.com/",
    changeOrigin: true,
  })
);

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Proxy server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await disconnectRedis();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await disconnectRedis();
  process.exit(0);
});

startServer();
