import { readFileSync } from "fs";
import path from "path";
import { z } from "zod";

import { Environments } from "../common/enum";
import { validateEnv } from "../common/utils";

const serverSchema = z.object({
  NODE_ENV: z.enum(Environments),
  PORT: z.string().nonempty(),
  SWAGGER_ENABLED: z.string().nonempty(),
});

function getPackageConfig() {
  const content = readFileSync(
    path.join(__dirname, "..", "..", "package.json"),
    "utf-8",
  );

  return JSON.parse(content);
}

export type ServerConfig = z.infer<typeof serverSchema>;

export function getServerConfig() {
  const env: ServerConfig = validateEnv(serverSchema, "server");
  const pkg = getPackageConfig();

  const name = pkg.name;
  const version = pkg.version;
  const license = pkg.license;
  const description = pkg.description ?? pkg.name;
  const environment = env.NODE_ENV as Environments;

  return {
    name,
    description,
    license,
    version,
    port: env.PORT,
    environment,
    swagger: {
      enabled: env.SWAGGER_ENABLED,
    },
  };
}

export type ApplicationConfig = ReturnType<typeof getServerConfig>;
