import { createClient } from "redis";
import { z } from "zod";

import logger from "../common/logger";
import { validateEnv } from "../common/utils";

const redisSchema = z.object({
  REDIS_HOST: z.string().nonempty(),
  REDIS_PORT: z.string().nonempty(),
});

type RedisENV = z.infer<typeof redisSchema>;

export function getRedisConfig() {
  const env: RedisENV = validateEnv(redisSchema, "redis");

  return {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
  };
}

export type RedisConfig = ReturnType<typeof getRedisConfig>;

const redisConfig = getRedisConfig();

export const redisClient = createClient({
  url: redisConfig.url,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.connect();
