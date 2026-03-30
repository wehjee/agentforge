import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6380";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});
