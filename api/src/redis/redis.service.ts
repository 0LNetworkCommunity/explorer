import { Redis } from 'ioredis';

export const redisClient = new Redis({
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});
