import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryStrategy: (times: number): number | void => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.disconnect();
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error);
  }
};