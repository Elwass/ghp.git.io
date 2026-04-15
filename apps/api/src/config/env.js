import dotenv from 'dotenv';

dotenv.config();

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export const env = {
  port: toNumber(process.env.PORT, 4000),
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/amoref',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  queueShards: toNumber(process.env.QUEUE_SHARDS, 6),
  workerConcurrency: toNumber(process.env.WORKER_CONCURRENCY, 30),
  workerRateLimitMax: toNumber(process.env.WORKER_RATE_LIMIT_MAX, 80),
  workerRateLimitDurationMs: toNumber(process.env.WORKER_RATE_LIMIT_DURATION_MS, 60000)
};
