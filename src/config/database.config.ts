import { DataSource } from "typeorm";
import { z } from "zod";

import { SnakeNamingStrategy } from "../common/database/snake-naming.strategy";
import { Environments } from "../common/enum";
import { validateEnv } from "../common/utils";
import { DEFAULT_CACHE } from "../common/utils/database.utils";
import { getRedisConfig } from "./redis.config";

const dbSchema = z.object({
  DB_HOST: z.string().nonempty(),
  DB_PORT: z.string().nonempty(),
  DB_USER: z.string().nonempty(),
  DB_PASSWORD: z.string().nonempty(),
  DB_NAME: z.string().nonempty(),
  DB_SYNCHRONIZE: z.enum(["true", "false"]),
  DB_LOGGING: z.enum(["true", "false"]),
  NODE_ENV: z.enum(Environments),
});

type DBConfig = z.infer<typeof dbSchema>;

export function getDbConfig() {
  const env: DBConfig = validateEnv(dbSchema, "database");
  const redisConfig = getRedisConfig();

  const config = {
    type: "postgres" as const,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    logging: env.DB_LOGGING === "true",
    synchronize: env.DB_SYNCHRONIZE === "true",
  };
  return {
    autoLoadEntities: true,
    ...config,
    dataSource: new DataSource({
      ...config,
      migrationsRun: true,
      entities: [__dirname + "/../**/*.entity{.ts,.js}"],
      migrations: [__dirname + "/../../../db/migrations/*{.ts,.js}"],
      namingStrategy: new SnakeNamingStrategy(),
      cache: {
        type: "redis",
        options: {
          socket: {
            host: redisConfig.host,
            port: redisConfig.port,
          },
        },
        alwaysEnabled: false,
        duration: DEFAULT_CACHE,
      },
    }),
  };
}

export type DatabaseConfig = ReturnType<typeof getDbConfig>;
const { dataSource } = getDbConfig();

export { dataSource };
export async function initDatabase() {
  if (!dataSource.isInitialized) await dataSource.initialize();
}
