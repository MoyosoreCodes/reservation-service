import { DataSource } from "typeorm";
import { z } from "zod";

import { SnakeNamingStrategy } from "../common/database/snake-naming.strategy";
import { Environments } from "../common/enum";
import { validateEnv } from "../common/utils";

const dbSchema = z.object({
  DB_HOST: z.string().nonempty(),
  DB_PORT: z.string().nonempty(),
  DB_USER: z.string().nonempty(),
  DB_PASSWORD: z.string().nonempty(),
  DB_NAME: z.string().nonempty(),
  NODE_ENV: z.enum(Environments),
});

type DBConfig = z.infer<typeof dbSchema>;

export function getDbConfig() {
  const env: DBConfig = validateEnv(dbSchema, "database");

  const config = {
    type: "postgres" as const,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    username: env.DB_USER,
    password: env.DB_PASSWORD,
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
    }),
  };
}

export type DatabaseConfig = ReturnType<typeof getDbConfig>;
const { dataSource } = getDbConfig();

export { dataSource };
export async function initDatabase() {
  if (!dataSource.isInitialized) await dataSource.initialize();
  await dataSource.runMigrations();
}
