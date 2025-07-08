import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Support both REDIS_URL and individual REDIS_HOST/REDIS_PORT
let redisUrl: string;
if (process.env.REDIS_URL) {
  redisUrl = process.env.REDIS_URL;
} else {
  const host = process.env.REDIS_HOST || "localhost";
  const port = process.env.REDIS_PORT || "6379";
  redisUrl = `redis://${host}:${port}`;
}

export const redis = new Redis(redisUrl, {
  retryStrategy: (times: number): number | void => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("ready", () => {
  console.log("Redis is ready");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.disconnect();
  } catch (error) {
    console.error("Failed to disconnect from Redis:", error);
  }
};
