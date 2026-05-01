import Redis from "ioredis";
import logger from "./logger";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

export const redis = new Redis(redisConfig);

export const redisPub = new Redis(redisConfig);
export const redisSub = new Redis(redisConfig);

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err) => {
  logger.error("Redis error", { error: err.message });
});

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 3600,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  // Rate limiting
  async incrementRateLimit(
    key: string,
    windowSeconds: number,
  ): Promise<number> {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) || 0;
  },

  // Session management
  async setSession(
    sessionId: string,
    data: unknown,
    ttlSeconds = 86400,
  ): Promise<void> {
    await this.set(`session:${sessionId}`, data, ttlSeconds);
  },

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(`session:${sessionId}`);
  },

  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(`session:${sessionId}`);
  },
};

export default redis;
